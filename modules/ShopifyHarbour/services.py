# from .schemas import *
# from modules.TicketsHarbour.dao import *
from .schemas import (
    SupportSettingsBase,
    SupportSettingsRead,
    SupportSettingsUpdateIn,
    TicketBase,
    TicketRatingIn,
    TicketRead,
    TicketUpdateIn,
)
from modules.TicketsHarbour.dao import SupportSettingsDao, TicketsDao

def _extract_email_from_raised_by(raised_by, fallback_email=None):
    if isinstance(raised_by, dict):
        return raised_by.get("email") or fallback_email
    return fallback_email

class TicketService:

    @staticmethod
    async def save(**data):

        web_url = data.get('web_url')
        support_settings_for_outlet = await SupportSettingsDao.get_by_outlet_id_or_web_url(web_url=web_url)

        if not support_settings_for_outlet:
            return {"error": f"SupportSettings not found for shop '{web_url}'"}, 404

        data["outlet_id"] = support_settings_for_outlet.outlet_id

        # additional = data.get("additional_details", {})
        # if not additional or "department" not in additional:
        #     return {"error": "department field is required"}, 400

        outlet_id = data["outlet_id"]
        support_settings_for_outlet = await SupportSettingsDao.get_by_outlet_id_or_web_url(outlet_id=outlet_id)
        settings = support_settings_for_outlet.settings

        ticket_prefix = settings["prefix"]
        start_no = settings["start_no"]
        email_required = settings["email_required"]
        #email = data.get("raised_by", {}).get("email")

        #if email_required and email is None:
        #    return {"error": "kindly provide email to generate Ticket."}, 400

        # ---- Generate ticket number ----
        last_ticket = await TicketsDao.get_last_ticket(outlet_id=outlet_id)
        if last_ticket:
            current_no = ''.join(ch for ch in last_ticket if ch.isdigit())
            next_no = int(current_no) + 1
        else:
            next_no = int(start_no)

        padded_no = str(next_no).zfill(3)
        support_ticket_id = f"{ticket_prefix}{padded_no}"

        data["support_ticket_id"] = support_ticket_id

        # department = additional.get("department")
        # department_agents = await AgentsDao.filters(outlet_id=outlet_id, department=department)

        # if not department_agents:
        #     return {"error": f"No agents found for department '{department}'"}, 400
        
        # # Find agent with least open tickets, default to first agent
        # lowest_load = -1
        # selected_agent = department_agents[0]
        
        # for agent in department_agents:
        #     open_ticket_count = await TicketsDao.count_open_tickets_by_agent(agent_id=agent.id)
        #     if open_ticket_count < lowest_load or lowest_load == -1:
        #         lowest_load = open_ticket_count
        #         selected_agent = agent

        # data["assigned_agent"] = selected_agent.id

        # 🔎 DEBUG: Print important values before insert
        print("========== DEBUG TICKET INSERT ==========")
        print("raised_by_id:", type(data.get("raised_by_id")), data.get("raised_by_id"))
        print("issue_id:", type(data.get("issue_id")), data.get("issue_id"))
        print("category_id:", type(data.get("category_id")), data.get("category_id"))
        print("sub_category_id:", type(data.get("sub_category_id")), data.get("sub_category_id"))
        print("==========================================")

        ticket_model = TicketBase(**data)
        id_ = await TicketsDao.create(ticket_model)
        return {"id": id_}, 200
    
    @staticmethod
    async def filters(**filters):
        web_url = filters.get("web_url")
        outlet_id = await SupportSettingsDao.get_outlet_by_web_url(web_url=web_url)
        filters.pop("web_url")
        filters["outlet_id"] = outlet_id

        tickets = await TicketsDao.filters_unauth(**filters)

        cleaned_tickets = []

        for t in tickets:
            print("========== DEBUG FILTER ==========")
            print("VALUE:", repr(t.assigned_agent_id))
            print("TYPE:", type(t.assigned_agent_id))
            print("IS NONE:", t.assigned_agent_id is None)
            print("EQUAL 'None':", t.assigned_agent_id == "None")
            print("==================================")

            # 🔥 CLEAN THE VALUE HERE
            if t.assigned_agent_id in ("None", "", None):
                t.assigned_agent_id = None

            cleaned_tickets.append(t)

        # Now validate cleaned tickets
        tickets = [
            TicketRead.model_validate(ticket, from_attributes=True).model_dump()
            for ticket in cleaned_tickets
        ]

        return {"tickets": tickets}, 200


    @staticmethod
    async def delete(**data):
        id_ = data.get('id')
        if not id_:
            raise ValueError("Missing 'id' to delete ticket")
        ticket = await TicketsDao.get_by_id(id=id_)
        if not ticket:
            return {"ticket": None}, 404
        
        customer_id = data.get("customer_id")
        ticket_customer_id = (ticket.customer_details or {}).get("customer_id")

        if int(customer_id) == int(ticket_customer_id):
            await TicketsDao.delete(id=id_)
            return {"id": id_}, 200
        else:
            return {"id":None}, 403
        
    

    @staticmethod
    async def close_ticket(**data):
        ticket_id = data.get("id")
        status = str(data.get("status", "")).lower()
        web_url = data.get("web_url")
        customer_id = data.get("customer_id")
        email = _extract_email_from_raised_by(data.get("raised_by"), data.get("email"))

        if not ticket_id:
            return {"error": "id is required"}, 400

        if status != "closed":
            return {"error": "status must be closed"}, 400

        if not web_url:
            return {"error": "web_url is required"}, 400

        if not customer_id or not email:
            return {"error": "customer_id and email are required"}, 400

        try:
            outlet_id = await SupportSettingsDao.get_outlet_by_web_url(web_url=web_url)
        except ValueError:
            return {"error": f"SupportSettings not found for shop '{web_url}'"}, 404
        
        ticket_id = int(ticket_id)
        ticket = await TicketsDao.get_by_id(id=ticket_id)
        if not ticket:
            return {"error": "Ticket not found"}, 404

        if ticket.outlet_id != outlet_id:
            return {"error": "Ticket does not belong to this shop"}, 403

        ticket_customer_id = (ticket.customer_details or {}).get("customer_id")
        ticket_email = (ticket.customer_details or {}).get("customer_email")

        if str(ticket_customer_id) != str(customer_id) or (ticket_email or "").lower() != str(email).lower():
            return {"error": "Not authorized to close this ticket"}, 403

        ticket_update = TicketUpdateIn(
            id=ticket_id,
            outlet_id=outlet_id,
            status=status,
            assigned_agent_id=ticket.assigned_agent_id,
        )

        updated_id = await TicketsDao.update_status_and_agent(ticket_update)

        if not updated_id:
            return {"error": "Ticket update failed"}, 404

        return {"id": updated_id, "status": status}, 200
        
        
    @staticmethod
    async def rate_ticket(**data):
        ticket_id = data.get("id")
        rating = data.get("rating")
        
        if not ticket_id or rating is None:
            return {"error": "id and rating are required"}, 400
        
        ticket = await TicketsDao.get_by_id(ticket_id)
        if not ticket:
            return {"error": "Ticket not found"}, 404
        
        if ticket.status != "closed":
            return {"error": "Can only rate closed tickets"}, 400
        
        rating_model = TicketRatingIn(id=ticket_id, rating=rating)
        
        id_ = await TicketsDao.update_agent_rating(ticket_id, rating_model.rating)
        return {"id": id_, "rating": rating_model.rating}, 200


class SupportSettingsService:

    @staticmethod
    async def save(**data):
        outlet_id = data.get("outlet_id")
        existing = await SupportSettingsDao.get_by_outlet_id_or_web_url(outlet_id=outlet_id)

        if existing:
            data["id"] = existing.id
            id_ = await SupportSettingsDao.update(SupportSettingsUpdateIn(**data))
            return {"id": id_}, 200

        model = SupportSettingsBase(**data)
        id_ = await SupportSettingsDao.create(model)
        return {"id": id_}, 200


    @staticmethod
    async def filters(**filters):
        settings = await SupportSettingsDao.filters(**filters)
        settings = [SupportSettingsRead.from_orm(i).model_dump() for i in settings]
        return {"settings": settings}, 200


    @staticmethod
    async def update(**data):
        id_ = await SupportSettingsDao.update(SupportSettingsUpdateIn(**data))
        return {"id": id_}, 200


    @staticmethod
    async def delete(**data):
        id_ = data.get("id")
        if not id_:
            raise ValueError("Missing id for deletion")

        await SupportSettingsDao.delete(id=id_)
        return {"id": id_}, 200

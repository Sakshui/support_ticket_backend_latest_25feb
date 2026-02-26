"""updated schemas tickets, agents, issues, category, sub_category, outlet mapping

Revision ID: ab9425b8b9ea
Revises: 5f4ddfda3ebb
Create Date: 2026-02-23 16:43:12.199264

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'ab9425b8b9ea'
down_revision: Union[str, Sequence[str], None] = '5f4ddfda3ebb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():

    # ==========================================================
    # 1 CREATE NEW TABLES FIRST
    # ==========================================================

    op.create_table(
        "issues",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("outlet_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_trash", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("outlet_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_trash", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "sub_categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("outlet_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_trash", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "outlet_issue_category_map",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("outlet_id", sa.Integer(), nullable=True),
        sa.Column("issue_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "outlet_category_subcategory_map",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("outlet_id", sa.Integer(), nullable=True),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("sub_category_id", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )

    # ==========================================================
    # 2 MODIFY AGENTS TABLE
    # ==========================================================

    op.add_column("agents", sa.Column("agent_first_name", sa.String(), nullable=False, server_default=""))
    op.add_column("agents", sa.Column("agent_last_name", sa.String(), nullable=False, server_default=""))
    op.add_column("agents", sa.Column("agent_email", sa.String(), nullable=False, server_default=""))
    op.add_column("agents", sa.Column("country_code", sa.String(), nullable=False, server_default=""))
    op.add_column("agents", sa.Column("phone", sa.String(), nullable=False, server_default=""))
    op.add_column("agents", sa.Column("location", sa.String(), nullable=False, server_default=""))
    op.add_column("agents", sa.Column("status", sa.String(), nullable=False, server_default="active"))
    op.add_column("agents", sa.Column("hired_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("agents", sa.Column("skills", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")))
    op.add_column("agents", sa.Column("languages", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")))
    op.add_column("agents", sa.Column("bio", sa.Text(), nullable=True))
    op.add_column("agents", sa.Column("timezone", sa.String(length=50), nullable=False, server_default="UTC"))
    op.add_column("agents", sa.Column("working_hours", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")))
    op.add_column("agents", sa.Column("working_days", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")))
    op.add_column("agents", sa.Column("category", sa.String(), nullable=False, server_default=""))
    op.add_column("agents", sa.Column("sub_category", sa.String(), nullable=False, server_default=""))
    op.add_column("agents", sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.add_column("agents", sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))

    # ==========================================================
    # 3 MODIFY TICKETS TABLE
    # ==========================================================

    # Rename columns
    op.alter_column("tickets", "assigned_agent", new_column_name="assigned_agent_id")
    op.alter_column("tickets", "is_in_trash", new_column_name="is_trash")

    # Convert raised_by JSONB → String
    op.alter_column(
        "tickets",
        "raised_by",
        type_=sa.String(),
        postgresql_using="raised_by::text"
    )

    # Add new columns
    op.add_column("tickets", sa.Column("subject", sa.String(), nullable=False, server_default=""))
    op.add_column("tickets", sa.Column("description", sa.String(), nullable=True))
    op.add_column("tickets", sa.Column("attachment", sa.String(), nullable=True))
    op.add_column("tickets", sa.Column("raised_by_id", sa.Integer(), nullable=True))
    op.add_column("tickets", sa.Column("tags", postgresql.JSONB(), nullable=True))
    op.add_column("tickets", sa.Column("priority", sa.String(), nullable=False, server_default="medium"))
    op.add_column("tickets", sa.Column("department", sa.String(), nullable=False, server_default="general"))
    op.add_column("tickets", sa.Column("issue_id", sa.Integer(), nullable=True))
    op.add_column("tickets", sa.Column("category_id", sa.Integer(), nullable=True))
    op.add_column("tickets", sa.Column("sub_category_id", sa.Integer(), nullable=True))
    op.add_column("tickets", sa.Column("previous_assigned_agent_id", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")))
    
    # Drop old columns
    op.drop_column("tickets", "content")
    op.drop_column("tickets", "additional_details")

    # ==========================================================
    # 4 ADD FOREIGN KEYS LAST
    # ==========================================================

    op.create_foreign_key(
        "fk_ticket_agent",
        "tickets",
        "agents",
        ["assigned_agent_id"],
        ["id"],
        ondelete="SET NULL"
    )

    op.create_foreign_key(
        "fk_ticket_issue",
        "tickets",
        "issues",
        ["issue_id"],
        ["id"]
    )

    op.create_foreign_key(
        "fk_ticket_category",
        "tickets",
        "categories",
        ["category_id"],
        ["id"]
    )

    op.create_foreign_key(
        "fk_ticket_subcategory",
        "tickets",
        "sub_categories",
        ["sub_category_id"],
        ["id"]
    )

    # Composite indexes
    op.create_index("ix_ticket_outlet_issue", "tickets", ["outlet_id", "issue_id"])
    op.create_index("ix_ticket_outlet_category", "tickets", ["outlet_id", "category_id"])
    op.create_index("ix_ticket_outlet_sub_category", "tickets", ["outlet_id", "sub_category_id"])


def downgrade():
    # ==========================================================
    # 1 DROP FOREIGN KEYS
    # ==========================================================

    op.drop_constraint("fk_ticket_subcategory", "tickets", type_="foreignkey")
    op.drop_constraint("fk_ticket_category", "tickets", type_="foreignkey")
    op.drop_constraint("fk_ticket_issue", "tickets", type_="foreignkey")
    op.drop_constraint("fk_ticket_agent", "tickets", type_="foreignkey")

    # ==========================================================
    # 2 DROP INDEXES
    # ==========================================================

    op.drop_index("ix_ticket_outlet_sub_category", table_name="tickets")
    op.drop_index("ix_ticket_outlet_category", table_name="tickets")
    op.drop_index("ix_ticket_outlet_issue", table_name="tickets")

    # ==========================================================
    # 3 REVERT TICKETS TABLE
    # ==========================================================

    # Re-add dropped columns
    op.add_column("tickets", sa.Column("content", postgresql.JSONB(), nullable=False))
    op.add_column("tickets", sa.Column("additional_details", postgresql.JSONB(), nullable=True))

    # Drop newly added columns
    op.drop_column("tickets", "previous_assigned_agent_id")
    op.drop_column("tickets", "sub_category_id")
    op.drop_column("tickets", "category_id")
    op.drop_column("tickets", "issue_id")
    op.drop_column("tickets", "department")
    op.drop_column("tickets", "priority")
    op.drop_column("tickets", "tags")
    op.drop_column("tickets", "raised_by_id")
    op.drop_column("tickets", "attachment")
    op.drop_column("tickets", "description")
    op.drop_column("tickets", "subject")

    # Revert raised_by type back to JSONB
    op.alter_column(
        "tickets",
        "raised_by",
        type_=postgresql.JSONB(),
        postgresql_using="raised_by::jsonb"
    )

    # Rename columns back
    op.alter_column("tickets", "assigned_agent_id", new_column_name="assigned_agent")
    op.alter_column("tickets", "is_trash", new_column_name="is_in_trash")

    # ==========================================================
    # 4 REVERT AGENTS TABLE
    # ==========================================================

    op.drop_column("agents", "updated_at")
    op.drop_column("agents", "created_at")
    op.drop_column("agents", "sub_category")
    op.drop_column("agents", "category")
    op.drop_column("agents", "working_days")
    op.drop_column("agents", "working_hours")
    op.drop_column("agents", "timezone")
    op.drop_column("agents", "bio")
    op.drop_column("agents", "languages")
    op.drop_column("agents", "skills")
    op.drop_column("agents", "hired_at")
    op.drop_column("agents", "status")
    op.drop_column("agents", "location")
    op.drop_column("agents", "phone")
    op.drop_column("agents", "country_code")
    op.drop_column("agents", "agent_email")
    op.drop_column("agents", "agent_last_name")
    op.drop_column("agents", "agent_first_name")

    # ==========================================================
    # 5 DROP NEW TABLES (REVERSE ORDER)
    # ==========================================================

    op.drop_table("outlet_category_subcategory_map")
    op.drop_table("outlet_issue_category_map")
    op.drop_table("sub_categories")
    op.drop_table("categories")
    op.drop_table("issues")
const newBase = "api.xircles.in";
const baseUrl = `api.xircles.in`;
const countries = "/country-details/";
const getState = "/state-details/";
const getCities = "/city-details/";
let globalLoyaltyPoints = null;
// ===== REPLACEMENT GLOBAL STATE =====
let selectedReplacementItemIds = [];
let replacementDetails = {};
let currentExchangeOrderData = null;

let allLoyaltyPointsHistory = [];
function getCustomerEmail() {
  return (
    globalThis.profile_email ||
    globalThis.customer_email ||
    globalThis?.Shopify?.customer?.email ||
    ""
  );
}

function formatDate(isoDate) {
  const date = new Date(isoDate);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Intl.DateTimeFormat("en-US", options).format(date);
}
async function updateOrdersContainer(customerOrders) {
  const ordersContainer = document.getElementById("ordersContainer");
  ordersContainer.innerHTML = "";

  if (customerOrders.length === 0) {
      ordersContainer.appendChild(createEmptyItemsCard("order"));
  } else {
      if (window.innerWidth > 768) {
          const tableElement = await createTableWithPagination(
              customerOrders,
              "orders",
              3
          );
          ordersContainer.appendChild(tableElement);
      } else {
          const cardElement = OrderTableMobile(customerOrders);
          ordersContainer.append(cardElement);
      }
  }
  attachReorderEventListeners();
}
async function LoyaltyPoints() {

  const url = `https://omc.axentraos.co.in/reports/customer_loyalty/`;

  try {
    const formData = new FormData();
    formData.append('app', 'oh_my_customer');
    formData.append('shop', Shopify.shop);
    formData.append('email', getCustomerEmail());

      const response = await fetch(url, {
          method: 'POST',
          body: formData,
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Raw API loyalty:', data);
      globalLoyaltyPoints = data; // assign to global variable
      return data;
  } catch (error) {
      console.error('❌ Error fetching API data:', error);
      globalLoyaltyPoints = 0; // or null if preferred
      return 0;
  }
  // finally {
  //   updateLoyaltyPointsContainer();
  //   redemptionOptions = getRedemptionOptions();
  // }
}
async function fetchAllLoyaltyPointsHistory() {

  const url = `https://loyalty.axentraos.co.in/api/v1/ledger/get_transactions/`;

  try {
    const formData = new FormData();
    formData.append("app", "oh_my_customer");
    formData.append("shop", Shopify.shop);
    formData.append("email", getCustomerEmail());
    formData.append("action", "all");

      const response = await fetch(url, {
          method: "POST",
          body: formData,
      });

      if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      const history_data = Array.isArray(data.transactions) ? data.transactions : [];

      allLoyaltyPointsHistory = history_data.map((entry) => ({
          ...entry,
          created_at: formatDate(entry.created_at), // format the date here
      }));
      console.log("Fetched loyalty points history:", allLoyaltyPointsHistory);
  } catch (error) {
      console.error("Failed to fetch loyalty points history:", error);
  }  // } finally {
  //     renderLoyaltyProgram()
  // }
}
async function fetchCountries() {
  try {
    const response = await fetch(`https://api.xircles.in${countries}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching countries:", error);
    return null; // Or throw the error, depending on how you want to handle it
  }
}

async function fetchStates(countryName) {
  try {
    const form_data = new FormData();
    form_data.append("country_name", countryName);

    const response = await fetch(`https://api.xircles.in${getState}`, {
      method: "POST",
      body: form_data,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching states for country: ${countryName}`, error);
    return null;
  }
}

async function fetchCities(stateName) {
  try {
    const form_data = new FormData();
    form_data.append("state_name", stateName);

    const response = await fetch(`https://api.xircles.in${getCities}`, {
      method: "POST",
      body: form_data,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching cities for state: ${stateName}`, error);
    return null;
  }
}
function handleLogout() {
  showLoader();
  window.location.href = "/account/login";
}
function createStatusToast(title, message, status = "success") {
  const isSuccess = status === "success";
  const mainColor = isSuccess ? "#22C55E" : "#EF4444";
  // const titleText = isSuccess ? "Success" : "Error";
  const titleText = title;
  // Remove previous toast if any
  const existing = document.querySelector(".toast-wrapper");
  if (existing) existing.remove();

  // Create wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "toast-wrapper";
  wrapper.style.position = "fixed";
  wrapper.style.bottom = "-150px";
  wrapper.style.right = "20px";
  wrapper.style.zIndex = "9999";
  wrapper.style.width = "360px";
  wrapper.style.transition = "bottom 0.4s ease-out";
  wrapper.style.animation = "slideUp 0.4s forwards";

  // Create toast
  const toast = document.createElement("div");
  toast.style.width = "100%";
  toast.style.height = "100%";
  toast.style.backgroundColor = "#fff";
  toast.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.15)";
  toast.style.display = "flex";
  toast.style.alignItems = "flex-start";
  toast.style.gap = "1rem";
  toast.style.padding = "12px 16px 16px 16px";
  toast.style.position = "relative"; // you can remove this too if not needed
  toast.innerHTML = `
  <div style="font-size: 14px !important; color: ${mainColor}; margin-top: 5px !important;">
  ${
    isSuccess
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${mainColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${mainColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>`
  }
  </div>
  <div style="display: flex; flex-direction: column; flex: 1;">
    <div style="display: flex; align-items: first baseline; margin-bottom: 4px;">
      <div style="display: block; width: 8px; height: 8px; border-radius: 50%; background-color: ${mainColor}; margin-right: 8px; font-family: var(--font-family);"></div>
      <span style="font-size: 15px !important; color: #000; font-family: var(--font-family);">${titleText}</span>
    </div>
    <div style="font-size: 14px !important; color: #4b5563; line-height: 1.3; font-family: var(--font-family);">${message}</div>
  </div>
  <button style="background: none; border: none; font-size: 16px !important; color: #7c7c7c; cursor: pointer; position: relative; top: -15px; right: -15px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
  </button>
  `;
  const closeBtn = toast.querySelector("button");
  closeBtn.addEventListener("click", () => wrapper.remove());
  wrapper.appendChild(toast);
  document.body.appendChild(wrapper);

  const style = document.createElement("style");
  style.innerHTML = `
      @keyframes slideUp {
        0% { bottom: -150px; opacity: 0; }
        100% { bottom: 20px; opacity: 1; }
      }
    `;
  document.head.appendChild(style);
  setTimeout(() => {
    wrapper.remove();
  }, 5000);
}
function Logout() {
  window.location.href = "/account/logout"; // Trigger logout
  createStatusToast(
    "Logged Out",
    "You’ve been successfully signed out of your account.",
    "success"
  ); // Optional: Replace with a better UI message
  handleLogout();
}
function previewImage(event) {
  let file = event.target.files[0];

  if (file) {
    if (file.size > 45 * 1024) {
      createStatusToast(
        "Upload Failed",
        "The image exceeds the maximum file size. Please upload a file smaller than 45KB.",
        "error"
      );
      event.target.value = ""; // Reset file input
      return;
    }

    let reader = new FileReader();
    reader.onload = function (e) {
      selectedImage = e.target.result;
      if (selectedImage) {
        setImage();
      }
    };
    reader.readAsDataURL(file);
  }
}
async function fetchWishlistOnReload() {
  console.log("fetch Wish list On Reload calling");

  try {
    console.log("customerId:", customerId);
    console.log("Shop:", Shopify.shop);

    const metafieldResponse = await fetch(
      `https://${baseUrl}/api/v1/get_metafield/?customerId=${customerId}&shop=${Shopify.shop}&app=oh_my_customer`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    // Check if the response is successful (status 200)
    if (!metafieldResponse.ok) {
      throw new Error("Failed to fetch metafield data");
    }

    const metafieldData = await metafieldResponse.json();
    console.log("Metafield Data:", metafieldData);

    // Check if 'metafields' is an array inside the nested object
    if (Array.isArray(metafieldData.metafields?.metafields)) {
      const existingMetafield = metafieldData.metafields.metafields.find(
        (metafield) =>
          metafield.namespace === "wishlist" && metafield.key === "items"
      );

      if (existingMetafield) {
        // Parse and return the wishlist
        const wishlist = JSON.parse(existingMetafield.value);
        renderWishlist(wishlist); // Call render Wishlist to display the wishlist
        return { id: existingMetafield.id, wishlist: wishlist };
      } else {
        console.log("No matching wishlist metafield found.");
        renderWishlist([]); // Call render Wishlist with an empty array
        return { id: null, wishlist: [] };
      }
    } else {
      // Handle case if metafields is not an array
      console.error("Error: metafields is not an array", metafieldData);
      renderWishlist([]); // Call render Wishlist with an empty array
      return { id: null, wishlist: [] };
    }
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    renderWishlist([]); // Call render Wishlist with an empty array
    return { id: null, wishlist: [] }; // Return empty wishlist in case of error
  }
}

// Save wishlist to metafield or sessionStorage
async function saveWishlist(wishlist, metafieldId, productId) {
  if (customerId) {
    if (!metafieldId) {
      console.error("Metafield ID is null, cannot save wishlist");
      return;
    }

    try {
      const metafieldPayload = {
        customerId: customerId,
        shop: Shopify.shop,
        app: "oh_my_customer",
        metafieldId: metafieldId,
        productId: productId,
        metafield: {
          id: metafieldId,
          namespace: "wishlist",
          key: "items",
          value: JSON.stringify(wishlist),
          type: "json",
        },
      };

      const url = `https://${baseUrl}/api/v1/update_metafield/`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metafieldPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Error saving wishlist: ${data.message}`);
      }

      console.log("Wishlist successfully saved to metafield:", wishlist);
    } catch (error) {
      console.error("Error saving wishlist:", error);
    }
  } else {
    sessionStorage.setItem("wishlist", JSON.stringify(wishlist));
    console.log("Logged out - Wishlist added to sessionStorage:", wishlist);
  }
}

async function syncSessionWishlistToMetafield() {
  const sessionWishlist = JSON.parse(sessionStorage.getItem("wishlist")) || [];
  console.log(
    "Syncing wishlist from sessionStorage to metafield:",
    sessionWishlist
  );

  if (sessionWishlist.length > 0 && customerId) {
    try {
      // Fetch existing wishlist from metafield for logged-in user
      const { id: metafieldId, wishlist: existingWishlist } =
        await fetchWishlist();

      // Combine sessionStorage wishlist with the existing wishlist (if any)
      // No need to stringify and parse objects again; simply concatenate the arrays
      const combinedWishlist = [...existingWishlist, ...sessionWishlist];

      // Save the combined wishlist to the metafield
      await saveWishlist(combinedWishlist, metafieldId);

      // Clear the sessionStorage wishlist after syncing
      sessionStorage.removeItem("wishlist");
      console.log(
        "Session wishlist successfully synced to metafield. Cleared sessionStorage."
      );
      fetchWishlistOnReload();
    } catch (error) {
      console.error("Error syncing wishlist to metafield:", error);
    }
  }
}
async function createMetafield() {
  try {
    const payload = {
      customerId: customerId,
      shop: Shopify.shop,
      app: "oh_my_customer",
      metafield: {
        namespace: "wishlist",
        key: "items",
        value: JSON.stringify([]),
        type: "json",
      },
    };

    const response = await fetch(`${baseURL}/api/v1/create_metafield/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Error creating metafield: ${data.message}`);
    }

    console.log("Metafield created successfully:", data);
    return data.metafield;
  } catch (error) {
    console.error("Error creating metafield:", error);
  }
}
function renderCalendarUI(product_name) {
  const modal = document.createElement("div");
  modal.innerHTML = `
      <div style="font-family: var(--font-family); position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div style="background: white; padding: 20px; width: 330px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); position: relative;">
          <span id="closeCross" style="cursor: pointer; font-size: 20px; font-weight: bold; color: #000; position: absolute; right: 20px; top: 5px;">&times;</span>
          <div style="display: flex; justify-content: center; align-items: center;">
            <span style="margin-top: 0px; font-size: 16px; font-weight: bold; color: #111;">Reminder Details!</span>
          </div>
          <div style="padding: 10px;">
            <label style="font-size: 16px; padding-bottom: 20px; color: #111;">Product Name: <strong>${product_name}</strong></label>
            <div id="calender-container"></div>
          </div>
          <div style="display: flex; justify-content: end; align-items: center; gap: 5px; margin-top: 20px;">
            <button id="closeModal" style="background: white; color: black; border: 1px solid black; padding: 8px 16px; cursor: pointer; font-size: 13px;">Cancel</button>
            <button id="setReminder" style="background: black; color: white; border: 1px solid black; padding: 8px 16px; cursor: pointer; font-size: 13px;">Set Reminder</button>
          </div>
        </div>
      </div>
    `;
  const calendarContainer = modal.querySelector("#calender-container");
  const container = document.createElement("div");
  container.style.cssText = `
      max-width: 350px;
      margin: auto;
      background: white;
      border-radius: 10px;
      font-size: 14px;
      position: relative;
    `;
  container.innerHTML = `
      <div style="font-weight: bold; margin-top: 20px; color: #111; font-size: 14px;">Reminder Date</div>
      <div style="padding: 10px; border: 1px solid #ccc; margin-top: 5px;">
        <div class="nav-buttons" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 25px 10px 25px; border-bottom: 1px solid #ccc;">
          <span id="prevMonth" style="cursor: pointer; font-size: 10px; color: #000;">&#10094;</span>
          <span id="month-year" style="font-weight: bold; color: #000;"></span>
          <span id="nextMonth" style="cursor: pointer; font-size: 10px; color: #000;">&#10095;</span>
        </div>
        <div class="weekdays" style="display: grid; grid-template-columns: repeat(7, 1fr); font-weight: bold; color: #666; margin-bottom: 10px; margin-top: 10px; text-align: center;">
          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
        </div>
        <div class="calendar" id="calendar" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;"></div>
      </div>
      <div style="font-weight: bold; margin-top: 20px; color: #111; font-size: 14px;">Reminder Time</div>
      <select id="timeSelect" style="margin-top: 5px; width: 100%; padding: 5px; border-radius: 4px; border: 1px solid #ccc;">
        ${Array.from({ length: 24 }, (_, i) => {
          const hour = i % 12 === 0 ? 12 : i % 12;
          const ampm = i < 12 ? "AM" : "PM";
          return `<option value="${String(i).padStart(
            2,
            "0"
          )}:00">${hour}:00 ${ampm}</option>`;
        }).join("")}
      </select>
    `;
  calendarContainer.appendChild(container);
  const calendar = container.querySelector("#calendar");
  const monthYear = container.querySelector("#month-year");
  const prevMonthBtn = container.querySelector("#prevMonth");
  const nextMonthBtn = container.querySelector("#nextMonth");
  const timeSelect = container.querySelector("#timeSelect");

  let date = new Date();
  let selectedDate = null;

  function renderCalendar(allowPast = false, allowFuture = true) {
    calendar.innerHTML = "";
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const month = date.toLocaleString("default", { month: "long" });
    monthYear.textContent = `${month} ${currentYear}`;
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize time

    // Previous month's days (non-selectable always)
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      const dayElement = document.createElement("div");
      dayElement.textContent = prevMonthLastDate - i;
      dayElement.style.cssText = `
    padding: 8px;
    text-align: center;
    color: #aaa;
    background: #f0f0f0;
  `;
      calendar.appendChild(dayElement);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      const thisDate = new Date(currentYear, currentMonth, day);
      thisDate.setHours(0, 0, 0, 0); // normalize time

      const isPast = thisDate < today;
      const isFuture = thisDate > today;
      const isSelectable =
        (isPast && allowPast) ||
        (!isPast && !isFuture) ||
        (isFuture && allowFuture);

      dayElement.className = "day";
      dayElement.textContent = day;
      dayElement.style.cssText = `
    padding: 8px;
    text-align: center;
    border-radius: 0px;
    cursor: ${isSelectable ? "pointer" : "not-allowed"};
    background: #f8f8f8;
    transition: background 0.2s;
    color: ${isSelectable ? "#000" : "#ccc"};
  `;
      if (isSelectable) {
        dayElement.addEventListener("mouseover", () => {
          if (!dayElement.classList.contains("selected")) {
            dayElement.style.backgroundColor = "#e0e0e0";
          }
        });

        dayElement.addEventListener("mouseout", () => {
          if (!dayElement.classList.contains("selected")) {
            dayElement.style.backgroundColor = "#f8f8f8";
          }
        });

        dayElement.addEventListener("click", () => {
          container.querySelectorAll(".day").forEach((d) => {
            if (d.style.cursor === "pointer") {
              d.classList.remove("selected");
              d.style.backgroundColor = "#f8f8f8";
              d.style.color = "#000";
            }
          });
          dayElement.classList.add("selected");
          dayElement.style.backgroundColor = "#000";
          dayElement.style.color = "#fff";
          selectedDate = `${currentYear}-${String(currentMonth + 1).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`;
        });
      }
      calendar.appendChild(dayElement);
    }
  }
  timeSelect.addEventListener("change", function () {
    if (selectedDate) {
      console.log("Selected Time:", timeSelect.value);
    }
  });
  prevMonthBtn.addEventListener("click", () => {
    const currentMonth = date.getMonth();
    date.setMonth(currentMonth - 1);
    renderCalendar();
  });

  nextMonthBtn.addEventListener("click", () => {
    const currentMonth = date.getMonth();
    date.setMonth(currentMonth + 1);
    renderCalendar();
  });
  renderCalendar();
  const closeBtn = modal.querySelector("#closeModal");
  const closeCrossBtn = modal.querySelector("#closeCross");
  const setReminderBtn = modal.querySelector("#setReminder");

  closeBtn.addEventListener("click", () => {
    modal.remove();
    const reminderEvent = new CustomEvent("reminderSet", { detail: null });
    document.dispatchEvent(reminderEvent);
  });
  closeCrossBtn.addEventListener("click", () => {
    modal.remove();
    const reminderEvent = new CustomEvent("reminderSet", { detail: null });
    document.dispatchEvent(reminderEvent);
  });
  setReminderBtn.addEventListener("click", () => {
    const selectedTime = timeSelect.value; // get time value
    console.log(!selectedDate, !selectedTime);
    if (!selectedDate || !selectedTime || selectedDate === null) {
      createStatusToast(
        "Missing Reminder Details",
        "Please select both a date and a time to create your reminder.",
        "error"
      );
      return;
    }
    const now = new Date();
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);

    const isToday = selectedDate === now.toISOString().slice(0, 10);
    if (isToday && selectedDateTime <= now) {
      createStatusToast(
        "Time Selection Error",
        "The selected time is invalid. Please choose a valid time to continue.",
        "error"
      );
      return;
    }
    const reminderDateTime = {
      date: selectedDate,
      time: selectedTime,
    };
    modal.remove();
    console.log("Reminder Set For:", reminderDateTime);
    const reminderEvent = new CustomEvent("reminderSet", {
      detail: reminderDateTime,
    });
    document.dispatchEvent(reminderEvent);
  });
  return modal;
}
// Set selected image in place of icon
function setImage() {
  if (selectedImage) {
    const url = (document.getElementById("logoImage").src = selectedImage);
    const updated_data = {
      customerId: customerId,
      customerData: {
        metafields: [
          {
            namespace: "custom",
            key: "logo_image",
            value: url || "", // optional default value if dob is empty
            type: "single_line_text_field",
          },
        ],
      },
      shop: Shopify.shop,
      app: "oh_my_customer",
    };

    console.log("Saving Personal Information:", updated_data);
    updateCustomerDetails(updated_data);
  }
}
function updateProfileImage(img_url, img_fn, img_ln) {
  const logoImage = document.getElementById("logoImage");
  const initialsAvatar = document.getElementById("initialsAvatar");

  if (img_url && img_url.trim() !== "") {
    // Image URL exists, so show the image and hide the initials
    logoImage.src = img_url;
    logoImage.style.display = "block"; // Make the image visible
    initialsAvatar.style.display = "none"; // Hide the initials
  } else {
    // Image URL is empty, so hide the image and show the initials
    logoImage.style.display = "none"; // Hide the image

    initialsAvatar.textContent = img_fn + img_ln; // Set the initials
    initialsAvatar.style.display = "flex"; // Make the initials visible
  }
}
updateProfileImage(img_url, img_fn, img_ln);
async function updateCustomerDetails(data) {
  document
    .querySelectorAll(".modal")
    .forEach((modal) => (modal.style.display = "none"));

  try {
    const response = await fetch(`https://${baseUrl}/api/v1/update-customer/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Added headers
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    const message_heading = result.customer
      ? "Profile Updated"
      : "Profile Update Unsuccessful";
    const message_subheading = result.customer
      ? "Your changes have been saved! Your updated details are now active on your account."
      : "Something went wrong and your changes weren’t saved. Please try again.";

    createStatusToast(
      message_heading,
      message_subheading,
      result.customer ? "success" : "error"
    );
  } catch (error) {
    // document.getElementById('response-message').innerText = 'Error: ' + error.message;
    createStatusToast(
      "Profile Update Unsuccessful",
      "Something went wrong and your changes weren’t saved. Please try again.",
      "error"
    );
  } finally {
    setTimeout(() => window.location.reload(), 500);
  }
}

const phonecode_list = [
  {
    name: "Afghanistan",
    flag: "🇦🇫",
    code: "AF",
    dial_code: "+93",
  },
  {
    name: "Åland Islands",
    flag: "🇦🇽",
    code: "AX",
    dial_code: "+358",
  },
  {
    name: "Albania",
    flag: "🇦🇱",
    code: "AL",
    dial_code: "+355",
  },
  {
    name: "Algeria",
    flag: "🇩🇿",
    code: "DZ",
    dial_code: "+213",
  },
  {
    name: "American Samoa",
    flag: "🇦🇸",
    code: "AS",
    dial_code: "+1684",
  },
  {
    name: "Andorra",
    flag: "🇦🇩",
    code: "AD",
    dial_code: "+376",
  },
  {
    name: "Angola",
    flag: "🇦🇴",
    code: "AO",
    dial_code: "+244",
  },
  {
    name: "Anguilla",
    flag: "🇦🇮",
    code: "AI",
    dial_code: "+1264",
  },
  {
    name: "Antarctica",
    flag: "🇦🇶",
    code: "AQ",
    dial_code: "+672",
  },
  {
    name: "Antigua and Barbuda",
    flag: "🇦🇬",
    code: "AG",
    dial_code: "+1268",
  },
  {
    name: "Argentina",
    flag: "🇦🇷",
    code: "AR",
    dial_code: "+54",
  },
  {
    name: "Armenia",
    flag: "🇦🇲",
    code: "AM",
    dial_code: "+374",
  },
  {
    name: "Aruba",
    flag: "🇦🇼",
    code: "AW",
    dial_code: "+297",
  },
  {
    name: "Australia",
    flag: "🇦🇺",
    code: "AU",
    dial_code: "+61",
  },
  {
    name: "Austria",
    flag: "🇦🇹",
    code: "AT",
    dial_code: "+43",
  },
  {
    name: "Azerbaijan",
    flag: "🇦🇿",
    code: "AZ",
    dial_code: "+994",
  },
  {
    name: "Bahamas",
    flag: "🇧🇸",
    code: "BS",
    dial_code: "+1242",
  },
  {
    name: "Bahrain",
    flag: "🇧🇭",
    code: "BH",
    dial_code: "+973",
  },
  {
    name: "Bangladesh",
    flag: "🇧🇩",
    code: "BD",
    dial_code: "+880",
  },
  {
    name: "Barbados",
    flag: "🇧🇧",
    code: "BB",
    dial_code: "+1246",
  },
  {
    name: "Belarus",
    flag: "🇧🇾",
    code: "BY",
    dial_code: "+375",
  },
  {
    name: "Belgium",
    flag: "🇧🇪",
    code: "BE",
    dial_code: "+32",
  },
  {
    name: "Belize",
    flag: "🇧🇿",
    code: "BZ",
    dial_code: "+501",
  },
  {
    name: "Benin",
    flag: "🇧🇯",
    code: "BJ",
    dial_code: "+229",
  },
  {
    name: "Bermuda",
    flag: "🇧🇲",
    code: "BM",
    dial_code: "+1441",
  },
  {
    name: "Bhutan",
    flag: "🇧🇹",
    code: "BT",
    dial_code: "+975",
  },
  {
    name: "Bolivia, Plurinational State of bolivia",
    flag: "🇧🇴",
    code: "BO",
    dial_code: "+591",
  },
  {
    name: "Bosnia and Herzegovina",
    flag: "🇧🇦",
    code: "BA",
    dial_code: "+387",
  },
  {
    name: "Botswana",
    flag: "🇧🇼",
    code: "BW",
    dial_code: "+267",
  },
  {
    name: "Bouvet Island",
    flag: "🇧🇻",
    code: "BV",
    dial_code: "+47",
  },
  {
    name: "Brazil",
    flag: "🇧🇷",
    code: "BR",
    dial_code: "+55",
  },
  {
    name: "British Indian Ocean Territory",
    flag: "🇮🇴",
    code: "IO",
    dial_code: "+246",
  },
  {
    name: "Brunei Darussalam",
    flag: "🇧🇳",
    code: "BN",
    dial_code: "+673",
  },
  {
    name: "Bulgaria",
    flag: "🇧🇬",
    code: "BG",
    dial_code: "+359",
  },
  {
    name: "Burkina Faso",
    flag: "🇧🇫",
    code: "BF",
    dial_code: "+226",
  },
  {
    name: "Burundi",
    flag: "🇧🇮",
    code: "BI",
    dial_code: "+257",
  },
  {
    name: "Cambodia",
    flag: "🇰🇭",
    code: "KH",
    dial_code: "+855",
  },
  {
    name: "Cameroon",
    flag: "🇨🇲",
    code: "CM",
    dial_code: "+237",
  },
  {
    name: "Canada",
    flag: "🇨🇦",
    code: "CA",
    dial_code: "+1",
  },
  {
    name: "Cape Verde",
    flag: "🇨🇻",
    code: "CV",
    dial_code: "+238",
  },
  {
    name: "Cayman Islands",
    flag: "🇰🇾",
    code: "KY",
    dial_code: "+345",
  },
  {
    name: "Central African Republic",
    flag: "🇨🇫",
    code: "CF",
    dial_code: "+236",
  },
  {
    name: "Chad",
    flag: "🇹🇩",
    code: "TD",
    dial_code: "+235",
  },
  {
    name: "Chile",
    flag: "🇨🇱",
    code: "CL",
    dial_code: "+56",
  },
  {
    name: "China",
    flag: "🇨🇳",
    code: "CN",
    dial_code: "+86",
  },
  {
    name: "Christmas Island",
    flag: "🇨🇽",
    code: "CX",
    dial_code: "+61",
  },
  {
    name: "Cocos (Keeling) Islands",
    flag: "🇨🇨",
    code: "CC",
    dial_code: "+61",
  },
  {
    name: "Colombia",
    flag: "🇨🇴",
    code: "CO",
    dial_code: "+57",
  },
  {
    name: "Comoros",
    flag: "🇰🇲",
    code: "KM",
    dial_code: "+269",
  },
  {
    name: "Congo",
    flag: "🇨🇬",
    code: "CG",
    dial_code: "+242",
  },
  {
    name: "Congo, The Democratic Republic of the Congo",
    flag: "🇨🇩",
    code: "CD",
    dial_code: "+243",
  },
  {
    name: "Cook Islands",
    flag: "🇨🇰",
    code: "CK",
    dial_code: "+682",
  },
  {
    name: "Costa Rica",
    flag: "🇨🇷",
    code: "CR",
    dial_code: "+506",
  },
  {
    name: "Cote d'Ivoire",
    flag: "🇨🇮",
    code: "CI",
    dial_code: "+225",
  },
  {
    name: "Croatia",
    flag: "🇭🇷",
    code: "HR",
    dial_code: "+385",
  },
  {
    name: "Cuba",
    flag: "🇨🇺",
    code: "CU",
    dial_code: "+53",
  },
  {
    name: "Cyprus",
    flag: "🇨🇾",
    code: "CY",
    dial_code: "+357",
  },
  {
    name: "Czech Republic",
    flag: "🇨🇿",
    code: "CZ",
    dial_code: "+420",
  },
  {
    name: "Denmark",
    flag: "🇩🇰",
    code: "DK",
    dial_code: "+45",
  },
  {
    name: "Djibouti",
    flag: "🇩🇯",
    code: "DJ",
    dial_code: "+253",
  },
  {
    name: "Dominica",
    flag: "🇩🇲",
    code: "DM",
    dial_code: "+1767",
  },
  {
    name: "Dominican Republic",
    flag: "🇩🇴",
    code: "DO",
    dial_code: "+1849",
  },
  {
    name: "Ecuador",
    flag: "🇪🇨",
    code: "EC",
    dial_code: "+593",
  },
  {
    name: "Egypt",
    flag: "🇪🇬",
    code: "EG",
    dial_code: "+20",
  },
  {
    name: "El Salvador",
    flag: "🇸🇻",
    code: "SV",
    dial_code: "+503",
  },
  {
    name: "Equatorial Guinea",
    flag: "🇬🇶",
    code: "GQ",
    dial_code: "+240",
  },
  {
    name: "Eritrea",
    flag: "🇪🇷",
    code: "ER",
    dial_code: "+291",
  },
  {
    name: "Estonia",
    flag: "🇪🇪",
    code: "EE",
    dial_code: "+372",
  },
  {
    name: "Ethiopia",
    flag: "🇪🇹",
    code: "ET",
    dial_code: "+251",
  },
  {
    name: "Falkland Islands (Malvinas)",
    flag: "🇫🇰",
    code: "FK",
    dial_code: "+500",
  },
  {
    name: "Faroe Islands",
    flag: "🇫🇴",
    code: "FO",
    dial_code: "+298",
  },
  {
    name: "Fiji",
    flag: "🇫🇯",
    code: "FJ",
    dial_code: "+679",
  },
  {
    name: "Finland",
    flag: "🇫🇮",
    code: "FI",
    dial_code: "+358",
  },
  {
    name: "France",
    flag: "🇫🇷",
    code: "FR",
    dial_code: "+33",
  },
  {
    name: "French Guiana",
    flag: "🇬🇫",
    code: "GF",
    dial_code: "+594",
  },
  {
    name: "French Polynesia",
    flag: "🇵🇫",
    code: "PF",
    dial_code: "+689",
  },
  {
    name: "French Southern Territories",
    flag: "🇹🇫",
    code: "TF",
    dial_code: "+262",
  },
  {
    name: "Gabon",
    flag: "🇬🇦",
    code: "GA",
    dial_code: "+241",
  },
  {
    name: "Gambia",
    flag: "🇬🇲",
    code: "GM",
    dial_code: "+220",
  },
  {
    name: "Georgia",
    flag: "🇬🇪",
    code: "GE",
    dial_code: "+995",
  },
  {
    name: "Germany",
    flag: "🇩🇪",
    code: "DE",
    dial_code: "+49",
  },
  {
    name: "Ghana",
    flag: "🇬🇭",
    code: "GH",
    dial_code: "+233",
  },
  {
    name: "Gibraltar",
    flag: "🇬🇮",
    code: "GI",
    dial_code: "+350",
  },
  {
    name: "Greece",
    flag: "🇬🇷",
    code: "GR",
    dial_code: "+30",
  },
  {
    name: "Greenland",
    flag: "🇬🇱",
    code: "GL",
    dial_code: "+299",
  },
  {
    name: "Grenada",
    flag: "🇬🇩",
    code: "GD",
    dial_code: "+1473",
  },
  {
    name: "Guadeloupe",
    flag: "🇬🇵",
    code: "GP",
    dial_code: "+590",
  },
  {
    name: "Guam",
    flag: "🇬🇺",
    code: "GU",
    dial_code: "+1671",
  },
  {
    name: "Guatemala",
    flag: "🇬🇹",
    code: "GT",
    dial_code: "+502",
  },
  {
    name: "Guernsey",
    flag: "🇬🇬",
    code: "GG",
    dial_code: "+44",
  },
  {
    name: "Guinea",
    flag: "🇬🇳",
    code: "GN",
    dial_code: "+224",
  },
  {
    name: "Guinea-Bissau",
    flag: "🇬🇼",
    code: "GW",
    dial_code: "+245",
  },
  {
    name: "Guyana",
    flag: "🇬🇾",
    code: "GY",
    dial_code: "+592",
  },
  {
    name: "Haiti",
    flag: "🇭🇹",
    code: "HT",
    dial_code: "+509",
  },
  {
    name: "Heard Island and Mcdonald Islands",
    flag: "🇭🇲",
    code: "HM",
    dial_code: "+672",
  },
  {
    name: "Holy See (Vatican City State)",
    flag: "🇻🇦",
    code: "VA",
    dial_code: "+379",
  },
  {
    name: "Honduras",
    flag: "🇭🇳",
    code: "HN",
    dial_code: "+504",
  },
  {
    name: "Hong Kong",
    flag: "🇭🇰",
    code: "HK",
    dial_code: "+852",
  },
  {
    name: "Hungary",
    flag: "🇭🇺",
    code: "HU",
    dial_code: "+36",
  },
  {
    name: "Iceland",
    flag: "🇮🇸",
    code: "IS",
    dial_code: "+354",
  },
  {
    name: "India",
    flag: "🇮🇳",
    code: "IN",
    dial_code: "+91",
  },
  {
    name: "Indonesia",
    flag: "🇮🇩",
    code: "ID",
    dial_code: "+62",
  },
  {
    name: "Iran, Islamic Republic of Persian Gulf",
    flag: "🇮🇷",
    code: "IR",
    dial_code: "+98",
  },
  {
    name: "Iraq",
    flag: "🇮🇶",
    code: "IQ",
    dial_code: "+964",
  },
  {
    name: "Ireland",
    flag: "🇮🇪",
    code: "IE",
    dial_code: "+353",
  },
  {
    name: "Isle of Man",
    flag: "🇮🇲",
    code: "IM",
    dial_code: "+44",
  },
  {
    name: "Israel",
    flag: "🇮🇱",
    code: "IL",
    dial_code: "+972",
  },
  {
    name: "Italy",
    flag: "🇮🇹",
    code: "IT",
    dial_code: "+39",
  },
  {
    name: "Jamaica",
    flag: "🇯🇲",
    code: "JM",
    dial_code: "+1876",
  },
  {
    name: "Japan",
    flag: "🇯🇵",
    code: "JP",
    dial_code: "+81",
  },
  {
    name: "Jersey",
    flag: "🇯🇪",
    code: "JE",
    dial_code: "+44",
  },
  {
    name: "Jordan",
    flag: "🇯🇴",
    code: "JO",
    dial_code: "+962",
  },
  {
    name: "Kazakhstan",
    flag: "🇰🇿",
    code: "KZ",
    dial_code: "+7",
  },
  {
    name: "Kenya",
    flag: "🇰🇪",
    code: "KE",
    dial_code: "+254",
  },
  {
    name: "Kiribati",
    flag: "🇰🇮",
    code: "KI",
    dial_code: "+686",
  },
  {
    name: "Korea, Democratic People's Republic of Korea",
    flag: "🇰🇵",
    code: "KP",
    dial_code: "+850",
  },
  {
    name: "Korea, Republic of South Korea",
    flag: "🇰🇷",
    code: "KR",
    dial_code: "+82",
  },
  {
    name: "Kosovo",
    flag: "🇽🇰",
    code: "XK",
    dial_code: "+383",
  },
  {
    name: "Kuwait",
    flag: "🇰🇼",
    code: "KW",
    dial_code: "+965",
  },
  {
    name: "Kyrgyzstan",
    flag: "🇰🇬",
    code: "KG",
    dial_code: "+996",
  },
  {
    name: "Laos",
    flag: "🇱🇦",
    code: "LA",
    dial_code: "+856",
  },
  {
    name: "Latvia",
    flag: "🇱🇻",
    code: "LV",
    dial_code: "+371",
  },
  {
    name: "Lebanon",
    flag: "🇱🇧",
    code: "LB",
    dial_code: "+961",
  },
  {
    name: "Lesotho",
    flag: "🇱🇸",
    code: "LS",
    dial_code: "+266",
  },
  {
    name: "Liberia",
    flag: "🇱🇷",
    code: "LR",
    dial_code: "+231",
  },
  {
    name: "Libyan Arab Jamahiriya",
    flag: "🇱🇾",
    code: "LY",
    dial_code: "+218",
  },
  {
    name: "Liechtenstein",
    flag: "🇱🇮",
    code: "LI",
    dial_code: "+423",
  },
  {
    name: "Lithuania",
    flag: "🇱🇹",
    code: "LT",
    dial_code: "+370",
  },
  {
    name: "Luxembourg",
    flag: "🇱🇺",
    code: "LU",
    dial_code: "+352",
  },
  {
    name: "Macao",
    flag: "🇲🇴",
    code: "MO",
    dial_code: "+853",
  },
  {
    name: "Macedonia",
    flag: "🇲🇰",
    code: "MK",
    dial_code: "+389",
  },
  {
    name: "Madagascar",
    flag: "🇲🇬",
    code: "MG",
    dial_code: "+261",
  },
  {
    name: "Malawi",
    flag: "🇲🇼",
    code: "MW",
    dial_code: "+265",
  },
  {
    name: "Malaysia",
    flag: "🇲🇾",
    code: "MY",
    dial_code: "+60",
  },
  {
    name: "Maldives",
    flag: "🇲🇻",
    code: "MV",
    dial_code: "+960",
  },
  {
    name: "Mali",
    flag: "🇲🇱",
    code: "ML",
    dial_code: "+223",
  },
  {
    name: "Malta",
    flag: "🇲🇹",
    code: "MT",
    dial_code: "+356",
  },
  {
    name: "Marshall Islands",
    flag: "🇲🇭",
    code: "MH",
    dial_code: "+692",
  },
  {
    name: "Martinique",
    flag: "🇲🇶",
    code: "MQ",
    dial_code: "+596",
  },
  {
    name: "Mauritania",
    flag: "🇲🇷",
    code: "MR",
    dial_code: "+222",
  },
  {
    name: "Mauritius",
    flag: "🇲🇺",
    code: "MU",
    dial_code: "+230",
  },
  {
    name: "Mayotte",
    flag: "🇾🇹",
    code: "YT",
    dial_code: "+262",
  },
  {
    name: "Mexico",
    flag: "🇲🇽",
    code: "MX",
    dial_code: "+52",
  },
  {
    name: "Micronesia, Federated States of Micronesia",
    flag: "🇫🇲",
    code: "FM",
    dial_code: "+691",
  },
  {
    name: "Moldova",
    flag: "🇲🇩",
    code: "MD",
    dial_code: "+373",
  },
  {
    name: "Monaco",
    flag: "🇲🇨",
    code: "MC",
    dial_code: "+377",
  },
  {
    name: "Mongolia",
    flag: "🇲🇳",
    code: "MN",
    dial_code: "+976",
  },
  {
    name: "Montenegro",
    flag: "🇲🇪",
    code: "ME",
    dial_code: "+382",
  },
  {
    name: "Montserrat",
    flag: "🇲🇸",
    code: "MS",
    dial_code: "+1664",
  },
  {
    name: "Morocco",
    flag: "🇲🇦",
    code: "MA",
    dial_code: "+212",
  },
  {
    name: "Mozambique",
    flag: "🇲🇿",
    code: "MZ",
    dial_code: "+258",
  },
  {
    name: "Myanmar",
    flag: "🇲🇲",
    code: "MM",
    dial_code: "+95",
  },
  {
    name: "Namibia",
    flag: "🇳🇦",
    code: "NA",
    dial_code: "+264",
  },
  {
    name: "Nauru",
    flag: "🇳🇷",
    code: "NR",
    dial_code: "+674",
  },
  {
    name: "Nepal",
    flag: "🇳🇵",
    code: "NP",
    dial_code: "+977",
  },
  {
    name: "Netherlands",
    flag: "🇳🇱",
    code: "NL",
    dial_code: "+31",
  },
  {
    name: "Netherlands Antilles",
    flag: "",
    code: "AN",
    dial_code: "+599",
  },
  {
    name: "New Caledonia",
    flag: "🇳🇨",
    code: "NC",
    dial_code: "+687",
  },
  {
    name: "New Zealand",
    flag: "🇳🇿",
    code: "NZ",
    dial_code: "+64",
  },
  {
    name: "Nicaragua",
    flag: "🇳🇮",
    code: "NI",
    dial_code: "+505",
  },
  {
    name: "Niger",
    flag: "🇳🇪",
    code: "NE",
    dial_code: "+227",
  },
  {
    name: "Nigeria",
    flag: "🇳🇬",
    code: "NG",
    dial_code: "+234",
  },
  {
    name: "Niue",
    flag: "🇳🇺",
    code: "NU",
    dial_code: "+683",
  },
  {
    name: "Norfolk Island",
    flag: "🇳🇫",
    code: "NF",
    dial_code: "+672",
  },
  {
    name: "Northern Mariana Islands",
    flag: "🇲🇵",
    code: "MP",
    dial_code: "+1670",
  },
  {
    name: "Norway",
    flag: "🇳🇴",
    code: "NO",
    dial_code: "+47",
  },
  {
    name: "Oman",
    flag: "🇴🇲",
    code: "OM",
    dial_code: "+968",
  },
  {
    name: "Pakistan",
    flag: "🇵🇰",
    code: "PK",
    dial_code: "+92",
  },
  {
    name: "Palau",
    flag: "🇵🇼",
    code: "PW",
    dial_code: "+680",
  },
  {
    name: "Palestinian Territory, Occupied",
    flag: "🇵🇸",
    code: "PS",
    dial_code: "+970",
  },
  {
    name: "Panama",
    flag: "🇵🇦",
    code: "PA",
    dial_code: "+507",
  },
  {
    name: "Papua New Guinea",
    flag: "🇵🇬",
    code: "PG",
    dial_code: "+675",
  },
  {
    name: "Paraguay",
    flag: "🇵🇾",
    code: "PY",
    dial_code: "+595",
  },
  {
    name: "Peru",
    flag: "🇵🇪",
    code: "PE",
    dial_code: "+51",
  },
  {
    name: "Philippines",
    flag: "🇵🇭",
    code: "PH",
    dial_code: "+63",
  },
  {
    name: "Pitcairn",
    flag: "🇵🇳",
    code: "PN",
    dial_code: "+64",
  },
  {
    name: "Poland",
    flag: "🇵🇱",
    code: "PL",
    dial_code: "+48",
  },
  {
    name: "Portugal",
    flag: "🇵🇹",
    code: "PT",
    dial_code: "+351",
  },
  {
    name: "Puerto Rico",
    flag: "🇵🇷",
    code: "PR",
    dial_code: "+1939",
  },
  {
    name: "Qatar",
    flag: "🇶🇦",
    code: "QA",
    dial_code: "+974",
  },
  {
    name: "Romania",
    flag: "🇷🇴",
    code: "RO",
    dial_code: "+40",
  },
  {
    name: "Russia",
    flag: "🇷🇺",
    code: "RU",
    dial_code: "+7",
  },
  {
    name: "Rwanda",
    flag: "🇷🇼",
    code: "RW",
    dial_code: "+250",
  },
  {
    name: "Reunion",
    flag: "🇷🇪",
    code: "RE",
    dial_code: "+262",
  },
  {
    name: "Saint Barthelemy",
    flag: "🇧🇱",
    code: "BL",
    dial_code: "+590",
  },
  {
    name: "Saint Helena, Ascension and Tristan Da Cunha",
    flag: "🇸🇭",
    code: "SH",
    dial_code: "+290",
  },
  {
    name: "Saint Kitts and Nevis",
    flag: "🇰🇳",
    code: "KN",
    dial_code: "+1869",
  },
  {
    name: "Saint Lucia",
    flag: "🇱🇨",
    code: "LC",
    dial_code: "+1758",
  },
  {
    name: "Saint Martin",
    flag: "🇲🇫",
    code: "MF",
    dial_code: "+590",
  },
  {
    name: "Saint Pierre and Miquelon",
    flag: "🇵🇲",
    code: "PM",
    dial_code: "+508",
  },
  {
    name: "Saint Vincent and the Grenadines",
    flag: "🇻🇨",
    code: "VC",
    dial_code: "+1784",
  },
  {
    name: "Samoa",
    flag: "🇼🇸",
    code: "WS",
    dial_code: "+685",
  },
  {
    name: "San Marino",
    flag: "🇸🇲",
    code: "SM",
    dial_code: "+378",
  },
  {
    name: "Sao Tome and Principe",
    flag: "🇸🇹",
    code: "ST",
    dial_code: "+239",
  },
  {
    name: "Saudi Arabia",
    flag: "🇸🇦",
    code: "SA",
    dial_code: "+966",
  },
  {
    name: "Senegal",
    flag: "🇸🇳",
    code: "SN",
    dial_code: "+221",
  },
  {
    name: "Serbia",
    flag: "🇷🇸",
    code: "RS",
    dial_code: "+381",
  },
  {
    name: "Seychelles",
    flag: "🇸🇨",
    code: "SC",
    dial_code: "+248",
  },
  {
    name: "Sierra Leone",
    flag: "🇸🇱",
    code: "SL",
    dial_code: "+232",
  },
  {
    name: "Singapore",
    flag: "🇸🇬",
    code: "SG",
    dial_code: "+65",
  },
  {
    name: "Slovakia",
    flag: "🇸🇰",
    code: "SK",
    dial_code: "+421",
  },
  {
    name: "Slovenia",
    flag: "🇸🇮",
    code: "SI",
    dial_code: "+386",
  },
  {
    name: "Solomon Islands",
    flag: "🇸🇧",
    code: "SB",
    dial_code: "+677",
  },
  {
    name: "Somalia",
    flag: "🇸🇴",
    code: "SO",
    dial_code: "+252",
  },
  {
    name: "South Africa",
    flag: "🇿🇦",
    code: "ZA",
    dial_code: "+27",
  },
  {
    name: "South Sudan",
    flag: "🇸🇸",
    code: "SS",
    dial_code: "+211",
  },
  {
    name: "South Georgia and the South Sandwich Islands",
    flag: "🇬🇸",
    code: "GS",
    dial_code: "+500",
  },
  {
    name: "Spain",
    flag: "🇪🇸",
    code: "ES",
    dial_code: "+34",
  },
  {
    name: "Sri Lanka",
    flag: "🇱🇰",
    code: "LK",
    dial_code: "+94",
  },
  {
    name: "Sudan",
    flag: "🇸🇩",
    code: "SD",
    dial_code: "+249",
  },
  {
    name: "Suriname",
    flag: "🇸🇷",
    code: "SR",
    dial_code: "+597",
  },
  {
    name: "Svalbard and Jan Mayen",
    flag: "🇸🇯",
    code: "SJ",
    dial_code: "+47",
  },
  {
    name: "Eswatini",
    flag: "🇸🇿",
    code: "SZ",
    dial_code: "+268",
  },
  {
    name: "Sweden",
    flag: "🇸🇪",
    code: "SE",
    dial_code: "+46",
  },
  {
    name: "Switzerland",
    flag: "🇨🇭",
    code: "CH",
    dial_code: "+41",
  },
  {
    name: "Syrian Arab Republic",
    flag: "🇸🇾",
    code: "SY",
    dial_code: "+963",
  },
  {
    name: "Taiwan",
    flag: "🇹🇼",
    code: "TW",
    dial_code: "+886",
  },
  {
    name: "Tajikistan",
    flag: "🇹🇯",
    code: "TJ",
    dial_code: "+992",
  },
  {
    name: "Tanzania, United Republic of Tanzania",
    flag: "🇹🇿",
    code: "TZ",
    dial_code: "+255",
  },
  {
    name: "Thailand",
    flag: "🇹🇭",
    code: "TH",
    dial_code: "+66",
  },
  {
    name: "Timor-Leste",
    flag: "🇹🇱",
    code: "TL",
    dial_code: "+670",
  },
  {
    name: "Togo",
    flag: "🇹🇬",
    code: "TG",
    dial_code: "+228",
  },
  {
    name: "Tokelau",
    flag: "🇹🇰",
    code: "TK",
    dial_code: "+690",
  },
  {
    name: "Tonga",
    flag: "🇹🇴",
    code: "TO",
    dial_code: "+676",
  },
  {
    name: "Trinidad and Tobago",
    flag: "🇹🇹",
    code: "TT",
    dial_code: "+1868",
  },
  {
    name: "Tunisia",
    flag: "🇹🇳",
    code: "TN",
    dial_code: "+216",
  },
  {
    name: "Turkey",
    flag: "🇹🇷",
    code: "TR",
    dial_code: "+90",
  },
  {
    name: "Turkmenistan",
    flag: "🇹🇲",
    code: "TM",
    dial_code: "+993",
  },
  {
    name: "Turks and Caicos Islands",
    flag: "🇹🇨",
    code: "TC",
    dial_code: "+1649",
  },
  {
    name: "Tuvalu",
    flag: "🇹🇻",
    code: "TV",
    dial_code: "+688",
  },
  {
    name: "Uganda",
    flag: "🇺🇬",
    code: "UG",
    dial_code: "+256",
  },
  {
    name: "Ukraine",
    flag: "🇺🇦",
    code: "UA",
    dial_code: "+380",
  },
  {
    name: "United Arab Emirates",
    flag: "🇦🇪",
    code: "AE",
    dial_code: "+971",
  },
  {
    name: "United Kingdom",
    flag: "🇬🇧",
    code: "GB",
    dial_code: "+44",
  },
  {
    name: "United States",
    flag: "🇺🇸",
    code: "US",
    dial_code: "+1",
  },
  {
    name: "Uruguay",
    flag: "🇺🇾",
    code: "UY",
    dial_code: "+598",
  },
  {
    name: "Uzbekistan",
    flag: "🇺🇿",
    code: "UZ",
    dial_code: "+998",
  },
  {
    name: "Vanuatu",
    flag: "🇻🇺",
    code: "VU",
    dial_code: "+678",
  },
  {
    name: "Venezuela, Bolivarian Republic of Venezuela",
    flag: "🇻🇪",
    code: "VE",
    dial_code: "+58",
  },
  {
    name: "Vietnam",
    flag: "🇻🇳",
    code: "VN",
    dial_code: "+84",
  },
  {
    name: "Virgin Islands, British",
    flag: "🇻🇬",
    code: "VG",
    dial_code: "+1284",
  },
  {
    name: "Virgin Islands, U.S.",
    flag: "🇻🇮",
    code: "VI",
    dial_code: "+1340",
  },
  {
    name: "Wallis and Futuna",
    flag: "🇼🇫",
    code: "WF",
    dial_code: "+681",
  },
  {
    name: "Yemen",
    flag: "🇾🇪",
    code: "YE",
    dial_code: "+967",
  },
  {
    name: "Zambia",
    flag: "🇿🇲",
    code: "ZM",
    dial_code: "+260",
  },
  {
    name: "Zimbabwe",
    flag: "🇿🇼",
    code: "ZW",
    dial_code: "+263",
  },
];

const menuOptions = [
  {
    label: "Dashboard",
    mobileLabel: "Dashboard",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-grid w-5 h-5 mr-2"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></svg>`,
    heading: "Dashboard",
    id: "dashboard",
  },
  {
    label: "My Orders",
    mobileLabel: "Orders",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-bag w-5 h-5 mr-2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
    heading: "My Orders",
    id: "myOrders",
  },
  {
    label: "My Profile",
    mobileLabel: "My Profile",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user w-5 h-5 mr-2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    heading: "My Profile",
    id: "myProfile",
  },
  {
    label: "My Wishlist",
    mobileLabel: "Wishlist",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart w-5 h-5 mr-2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>`,
    heading: "My Wishlist",
    id: "myWishlist",
  },
  {
    label: "Loyalty Points",
    mobileLabel: "Loyalty",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-award w-5 h-5 mr-2"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"></path><circle cx="12" cy="8" r="6"></circle></svg>`,
    heading: "Loyalty Points",
    id: "Loyalty",
  },
  {
    label: "Recently Viewed",
    mobileLabel: "Recent",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history w-5 h-5 mr-2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path></svg>`,
    heading: "Recently Viewed",
    id: "recentlyViewed",
  },
  {
    label: "Support Tickets",
    mobileLabel: "Support",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-more w-5 h-5 mr-2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M8 10h.01"></path><path d="M12 10h.01"></path><path d="M16 10h.01"></path></svg>`,
    heading: "Support Tickets",
    id: "supportTickets",
  },
  {
    label: "Security & Privacy",
    mobileLabel: "Password",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check w-5 h-5 mr-2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg>`,
    heading: "Security & Privacy",
    id: "changePassword",
  },
  {
    label: "Logout",
    mobileLabel: "Logout",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out w-5 h-5 mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>`,
    heading: "Logout",
    id: "logout",
  },
];
const filledHeart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="red" stroke="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart w-5 h-5 mr-2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>`;

const outlineHeart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart w-5 h-5 mr-2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>`;

const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 16px; width: 16px;">
              <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>`;

const eyeDashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off h-4 w-4"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path><path d="m2 2 20 20"></path></svg>`;

function renderMenu() {
  console.log("menu updated!!!");
  const menuElement = document.getElementById("xircls-menu");
  menuElement.innerHTML = ""; // Clear previous menu items
  console.log(menuOptions, menuElement, "menuElements11");
  const menuOptions2 = menuOptions.map((option, index) => ({
    ...option,
    originalIndex: index,
  })); // Store original index
  // .filter(option => {
  //     const isEnabled = elementsObj[option.id].enabled === true;
  //     console.log(`Option ID: ${option.id}, Enabled: ${isEnabled}`);
  //     return isEnabled;
  // });

  const ulElement = document.createElement("ul");
  ulElement.className = "menu-list";
  console.log(menuOptions2, "menuElements");
  menuOptions2.forEach((item, index) => {
    if (item.label === "Logout") {
      const hrElement = document.createElement("hr");
      hrElement.style.border = "1px solid #e5e7eb";
      hrElement.style.width = "100%";
      hrElement.style.margin = "20px 0px";

      ulElement.appendChild(hrElement);
    }

    const liElement = document.createElement("li");
    liElement.dataset.index = item.originalIndex;
    liElement.className = "xircls-menu-item";

    liElement.innerHTML = `
                    <span class="xircls-menu-icon">${item.icon}</span>
                    <span class="xircls-menu-label">${item.label}</span>
                    `;

    liElement.onclick = () => {
      console.log(`You clicked on: ${item.heading}`);
      renderContent(parseInt(liElement.dataset.index));

      const allItems = document.querySelectorAll(".xircls-menu-item");
      allItems.forEach((item) => item.classList.remove("active"));

      liElement.classList.add("active"); // Add the active class to the clicked item
    };

    ulElement.appendChild(liElement);
  });

  menuElement.appendChild(ulElement);
}
// Array to store content divs
const renderedContentDivs = {}; // Use an object for clarity

// Populate the array with the content divs
document.addEventListener("DOMContentLoaded", function () {});

function renderContent(index) {
  const containerByMenuId = {
    dashboard: "dashboardContainer",
    myOrders: "ordersContainer",
    myProfile: "profileContainer",
    myWishlist: "wishListsContainer",
    Loyalty: "loyaltyContainer",
    recentlyViewed: "RecentsContainer",
    supportTickets: "supportTicketsContainer",
    changePassword: "securityContainer",
  };
  const selectedMenuOption = menuOptions[index];
  console.log("content rendering....", index, selectedMenuOption?.id);

  //Get all the tabs
  const tabHeading = document.getElementById("tabHeading");
  //Get all the tab content
  const tabContent = document.getElementById("tabContent");

  // Add content to header according to tab selected
  if (selectedMenuOption && tabHeading) {
    tabHeading.innerText = selectedMenuOption.heading;
  }
  let contentDiv = null;

  //Checking if tab content is empty
  if (!tabContent) {
    console.error("tabContent not found");
    return;
  }
  if (selectedMenuOption?.id === "logout") {
    console.log("Logout option clicked");
    //Call the logout function
    Logout();

    //exit function
    return;
  }
  // Check if the contentDiv exists
  if (selectedMenuOption?.id === "supportTickets") {
    contentDiv = ensureSupportTicketsContainer();
  } else {
    const containerId = containerByMenuId[selectedMenuOption?.id];
    if (containerId) {
      contentDiv = document.getElementById(containerId);
    }
  }
  if (!contentDiv) {
    console.error("Content container for index " + index + " is missing!");
    return;
  }

  //Logout the user

  // Render content depending on the id

  if (selectedMenuOption?.id === "recentlyViewed") {
    renderRecentlyViewed();
  }
  if (selectedMenuOption?.id === "myWishlist") {
    // renderWishlist()
    fetchWishlistOnReload();
  }
  if (index === 4) {
    renderArmaniLoyaltyContainer();
  }

  // Hide all content divs and only show the selected one
  Object.values(containerByMenuId).forEach((containerId) => {
    renderedContentDivs[containerId] = document.getElementById(containerId);
  });

  Object.values(renderedContentDivs).forEach((div) => {
    if (div) div.style.display = "none";
  });

  //Display the current div selected
  contentDiv.style.display = "block";

  // Add the active class to the clicked item
  const allItems = document.querySelectorAll(".xircls-menu-item");
  allItems.forEach((item) => item.classList.remove("active"));

  //Query through the menu and add the active class
  const activeItem = document.querySelector(
    `.xircls-menu-item:nth-child(${index + 1})`
  );

  //check if menu option exists
  if (menuOptions[index]) {
    //console log which menu item has been clicked
    console.log(activeItem, index + 1, "menu item activated!");

    //Add the active styling to selected tab
    if (activeItem) {
      activeItem.classList.add("active");
    }
  }
}
async function updateCustomerAddress(data) {
  document
    .querySelectorAll(".modal")
    .forEach((modal) => (modal.style.display = "none"));

  try {
    const response = await fetch(
      `https://${baseUrl}/api/v1/update-customer-address/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const responseData = await response.json();

    // Check for a successful customer update
    const message = responseData.customer
      ? {
          text: "Address Updated",
          subtext:
            "Your changes have been saved! Your updated details are now active on your account.",
          type: "success",
        }
      : {
          text: "Couldn’t Update Address",
          subtext:
            "We couldn’t save your address. Please check the details and try again.",
          type: "error",
        };
    createStatusToast(message.text, message.subtext, message.type);
  } catch (error) {
    // document.getElementById('response-message').innerText = 'Error: ' + error.message;
    createStatusToast(
      "Couldn’t Update Address",
      "We couldn’t save your address. Please check the details and try again.",
      "error"
    );
  } finally {
    setTimeout(() => window.location.reload(), 500);
  }
}
async function addCustomerAddress(data) {
  document
    .querySelectorAll(".modal")
    .forEach((modal) => (modal.style.display = "none"));
  try {
    const response = await fetch(
      `https://${baseUrl}/api/v1/add_customer_address/`,
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = await response.json();

    let message = "Address details are Invalid!";
    let messageType = "error";

    if (result.message) {
      const messageData = JSON.parse(result.message);
      if (messageData.customer_address && messageData.customer_address.id) {
        message = "Address Updated";
        messageType = "success";
      }

      // ✅ Return parsed messageData to caller
      return messageData;
    }

    return null;
  } catch (error) {
    console.error("Request failed", error);
    return null;
  } finally {
    setTimeout(() => window.location.reload(), 500);
  }
}
function getFunctionToCall(headingText, id) {
  console.log(headingText, "==============", id);
  // Based on the headingText, return a function that triggers an API call
  if (headingText === "Personal Information") {
    return function (data) {
      const updated_data = {
        customerId: customerId,
        customerData: {
          first_name: data.firstName, // Get from the
          last_name: data.lastName,
          email: data.email, // Get email from form
          phone: data.phone,
          metafields: [
            {
              namespace: "custom",
              key: "name",
              value: data.firstName + " " + data.lastName, // Joining data coming in from separate
              type: "single_line_text_field", // Correct type to use
            },
            {
              namespace: "custom",
              key: "date_of_birth",
              value: data.birthDate || "", // optional default value if dob is empty
              type: "date",
            },
            {
              namespace: "custom",
              key: "gender",
              value: data.gender || "", // default to "male" if not provided
              type: "single_line_text_field",
            },
            {
              namespace: "custom",
              key: "country_code",
              value: data.phoneCode || "",
              type: "single_line_text_field",
            },
            {
              namespace: "custom",
              key: "mobile_no",
              value: data.phone || "",
              type: "single_line_text_field",
            },
          ],
        },
        shop: Shopify.shop,
        app: "oh_my_customer",
      };

      console.log(data, updated_data, "Saving Personal Information:");
      updateCustomerDetails(updated_data);
    };
  }

  // if (headingText === "Contact Information") {
  //     return function (data) {
  //         const updated_data = {
  //             customerId: customerId,
  //             customerData: {
  //                 email: data.email,
  //                 phone: data.mobile,
  //             },
  //             shop: Shopify.shop,
  //             app: "oh_my_customer"
  //         };

  //         console.log("Saving Contact Information:", data, updated_data);
  //         updateCustomerDetails(updated_data)
  //     };
  // }

  // if (headingText === "Shipping Information" && id !== undefined) {
  //     return function (data) {
  //         const updated_data = {
  //             customerId: customerId,
  //             addressId: id,
  //             addressData: {
  //                 address1: data.addressline1,
  //                 address2: data.addressline2,
  //                 city: data.city,
  //                 province: data.state,
  //                 zip: data.zipcode,
  //                 country: data.country,
  //             },
  //             shop: Shopify.shop,
  //             app: "oh_my_customer",
  //         };

  //         console.log("Saving Shipping Information:", data, updated_data, id);
  //         updateCustomerAddress(updated_data)
  //     };
  // }
  if (headingText === "Shipping Information" && id !== undefined) {
    return async function (data) {
      try {
        // Step 1: Fetch all metafields (similar to new address case)
        const metafieldResponse = await fetch(
          `https://${baseUrl}/api/v1/get_metafield/?customerId=${customerId}&shop=${Shopify.shop}&app=oh_my_customer`
        );
        const metafieldData = await metafieldResponse.json();
        const allMetafields = metafieldData?.metafields?.metafields || [];
        // Step 7: Update address
        const updated_data = {
          customerId: customerId,
          addressId: id,
          addressData: {
            address1: data.addressLine1,
            address2: data.addressLine2,
            city: data.city,
            province: data.state,
            zip: data.zip,
            country: data.country,
          },
          shop: Shopify.shop,
          app: "oh_my_customer",
        };

        console.log("Saving Shipping Information:", data, updated_data, id);
        updateCustomerAddress(updated_data);
        // Step 2: Find the relevant addressData metafield again
        const addressMeta = allMetafields.find(
          (mf) => mf.namespace === "addressData" && mf.key === "items"
        );

        let addressItems = [];
        const existingMetafieldId = addressMeta?.id; // Capture the metafield ID

        if (addressMeta?.value) {
          try {
            const parsed = JSON.parse(addressMeta.value);
            if (Array.isArray(parsed)) {
              addressItems = parsed;
            } else {
              console.warn("Metafield value is not an array, resetting to []");
            }
          } catch (e) {
            console.warn("Error parsing metafield JSON, resetting to []");
          }
        }

        // Step 3: Find the correct address item within addressItems to update it
        const addressIndex = addressItems.findIndex(
          (item) => item.address_id === id
        );

        if (addressIndex === -1) {
          console.warn(`Address with ID ${id} not found in metafield!`);
          // You might want to handle this case (e.g., throw an error)
          return;
        }

        // Step 4: Update the addressData item - CREATE properties if they don't exist
        addressItems[addressIndex] = {
          ...addressItems[addressIndex], // Keep the existing data
          contact_name: data.contactName !== undefined ? data.contactName : "", // Update or create if they don't exist
          relation: data.relationship !== undefined ? data.relationship : "", // Update or create if they don't exist
          addressas: data.addressName !== undefined ? data.addressName : "",
        };

        console.log(addressItems, "submittt");

        // Step 5: Prepare metafield payload to update
        const metafieldPayload = {
          customerId: customerId,
          shop: Shopify.shop,
          app: "oh_my_customer",
          metafieldId: existingMetafieldId,
          productId: "",
          metafield: {
            ...(existingMetafieldId && { id: existingMetafieldId }),
            namespace: "addressData",
            key: "items",
            value: JSON.stringify(addressItems),
            type: "json",
          },
        };

        // Step 6: Save the metafield update
        const saveResponse = await fetch(
          `https://${baseUrl}/api/v1/update_metafield/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(metafieldPayload),
          }
        );

        const savedData = await saveResponse.json();

        if (!saveResponse.ok) {
          throw new Error(`Error updating metafield: ${savedData.message}`);
        }

        console.log("Saved updated address metadata:", savedData);
      } catch (error) {
        console.error("Error saving shipping info:", error);
        // showAlert("Failed to save address info", "failure");
        createStatusToast(
          "Couldn’t Update Address",
          "We couldn’t save your address. Please check the details and try again.",
          "error"
        );
      }
    };
  }

  if (headingText === "Shipping Information" && id === undefined) {
    return async function (data) {
      try {
        // Step 1: Fetch all metafields
        const metafieldResponse = await fetch(
          `https://${baseUrl}/api/v1/get_metafield/?customerId=${customerId}&shop=${Shopify.shop}&app=oh_my_customer`
        );
        const metafieldData = await metafieldResponse.json();

        const allMetafields = metafieldData?.metafields?.metafields || [];

        // Step 2: Find the relevant addressData metafield
        const addressMeta = allMetafields.find(
          (mf) => mf.namespace === "addressData" && mf.key === "items"
        );

        let addressItems = [];
        const existingMetafieldId = addressMeta?.id;

        if (addressMeta?.value) {
          try {
            const parsed = JSON.parse(addressMeta.value);
            if (Array.isArray(parsed)) {
              addressItems = parsed;
            } else {
              console.warn("Metafield value is not an array, resetting to []");
            }
          } catch (e) {
            console.warn("Error parsing metafield JSON, resetting to []");
          }
        }

        // Step 3: Create the new address
        const addressPayload = {
          customerId: customerId,
          addressData: {
            address1: data.addressLine1,
            address2: data.addressLine2,
            city: data.city,
            province: data.state,
            zip: data.zip,
            country: data.country,
          },
          shop: Shopify.shop,
          app: "oh_my_customer",
        };

        const addressResponse = await addCustomerAddress(addressPayload);
        const newAddressId = addressResponse?.customer_address?.id;

        console.log("Created new address:", newAddressId);

        if (!newAddressId) {
          throw new Error("Address creation failed or ID not returned.");
        }

        // Step 4: Append new address entry
        addressItems.push({
          address_id: newAddressId,
          contact_name: data.contactName || "",
          relation: data.relationship || "",
          addressas: data.addressName || "",
        });

        // Step 5: Prepare metafield payload
        const metafieldPayload = {
          customerId: customerId,
          shop: Shopify.shop,
          app: "oh_my_customer",
          metafieldId: existingMetafieldId,
          productId: "",
          metafield: {
            ...(existingMetafieldId && { id: existingMetafieldId }),
            namespace: "addressData",
            key: "items",
            value: JSON.stringify(addressItems),
            type: "json",
          },
        };

        // Step 6: Send to correct endpoint
        const url = existingMetafieldId
          ? `https://${baseUrl}/api/v1/update_metafield/`
          : `https://${baseUrl}/api/v1/create_metafield/`;

        const saveResponse = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metafieldPayload),
        });

        const savedData = await saveResponse.json();

        if (!saveResponse.ok) {
          throw new Error(`Error saving metafield: ${savedData.message}`);
        }

        console.log("Saved updated address metadata:", savedData);
      } catch (error) {
        console.error("Error saving shipping info:", error);
        // showAlert("Failed to save address info", "failure");
        createStatusToast(
          "Couldn’t Update Address",
          "We couldn’t save your address. Please check the details and try again.",
          "error"
        );
      }
    };
  }

  // If no match, return a function that does nothing (or could return an error)
  return function (data) {
    console.error("Unknown heading:", headingText);
  };
}
async function fetchAddressMeta() {
  if (customerId) {
    try {
      const metafieldResponse = await fetch(
        `https://${baseUrl}/api/v1/get_metafield/?customerId=${customerId}&shop=${Shopify.shop}&app=oh_my_customer`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const metafieldData = await metafieldResponse.json();

      if (
        metafieldData.metafields &&
        Array.isArray(metafieldData.metafields.metafields)
      ) {
        const existingMetafield = metafieldData.metafields.metafields.find(
          (metafield) =>
            metafield.namespace === "addressData" && metafield.key === "items"
        );
        console.log(existingMetafield, "existsj");
        if (existingMetafield) {
          return {
            id: existingMetafield.id,
            addressMeta: JSON.parse(existingMetafield.value),
          };
        }
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      return { id: null, addressMeta: [] };
    }
  }
}
async function deleteCustomerAddress(addressId) {
  document
    .querySelectorAll(".modal")
    .forEach((modal) => (modal.style.display = "none"));

  try {
    const data = {
      customerId: customerId,
      addressId: addressId,
      shop: Shopify.shop,
      app: "oh_my_customer",
    };

    const response = await fetch(
      `https://${baseUrl}/api/v1/delete_customer_address/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    const message_heading = response.ok
      ? "Address Deleted"
      : "Couldn’t Delete Address";
    const message_subheading = response.ok
      ? "Your changes have been saved! Your updated details are now active on your account."
      : "We couldn’t delete your address. Please check the details and try again.";

    createStatusToast(
      message_heading,
      message_subheading,
      response.ok ? "success" : "error"
    );
  } catch (error) {
    createStatusToast(
      `Address Delete Fail`,
      "We couldn’t delete your address. Please check the details and try again.",
      "error"
    );
    console.error("Error:", error);
  } finally {
    setTimeout(() => window.location.reload(), 500);
  }
}
async function renderProfileContainer(cardData) {
  console.log(cardData, "cardData");
  const profileData = cardData[0].data;
  const addressDataArray = cardData[2].data;
  const profileContainer = document.getElementById("profileContainer");
  profileContainer.innerText = "";
  const addressMetafields = await fetchAddressMeta();
  console.log(addressMetafields, "addressmeta");

  // Input Style
  const inputStyle = `
      width: 100%;
      background-color: transparent;
      padding: 8px 0;
      border-radius: 0;
      font-size: 14px;
      border: none;
      border-bottom: 1px solid #e5e7eb;
      outline: none;
      text-align: left;
  `;

  // Generate phone code options HTML
  const phoneCodeOptions =
    phonecode_list && Array.isArray(phonecode_list)
      ? phonecode_list
          .map(
            (code) =>
              `<option value="${code.dial_code}" ${
                profileData?.PhoneCode === code.dial_code ? "selected" : ""
              }>${code.dial_code}</option>`
          )
          .join("")
      : "";

  // --- Render Profile Form ---
  const renderProfileForm = () => {
    const profileFormContainer = document.createElement("div");
    profileFormContainer.id = "profileFormContainer";

    profileFormContainer.innerHTML = `
    <form id="profileForm" class="xircls-profile-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 0; text-align:left;">
      <div style="grid-column: 1 / span 1; margin-bottom: 16px;">
          <div style="font-size: 18px; margin-bottom: 16px; color: black">Personal Information</div>
      </div>

      <div style="display: flex; flex-direction: column; grid-column: 1 / span 1;">
          <label for="firstName" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">First Name</label>
          <input type="text" id="firstName" value="${
            profileData?.Name?.split(" ")[0] || ""
          }" name="firstName" style="${inputStyle}">
      </div>

      <div style="display: flex; flex-direction: column;">
          <label for="lastName" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Last Name</label>
          <input type="text" id="lastName" value="${
            profileData?.Name?.split(" ").slice(1).join(" ") || ""
          }" name="lastName" style="${inputStyle}">
      </div>

      <div style="display: flex; flex-direction: column;">
          <label for="email" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Email Address</label>
          <input type="email" id="email" name="email" value="${
            profileData?.Email
          }" disabled style="${inputStyle}">
      </div>

      <div style="display: flex; flex-direction: column;">
          <label for="phone" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Phone Number</label>
          <div style="display: flex; gap: 10px;">
              <select id="phoneCode" name="phoneCode" style="${inputStyle}; width: 30%;">
                  ${phoneCodeOptions}
              </select>
              <input type="tel" id="phone" name="phone" value="${
                profileData?.Mobile
              }" style="${inputStyle}">
          </div>
      </div>

      <div style="display: flex; flex-direction: column;">
          <label for="birthDate" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Birth Date</label>
          <input type="date" id="birthDate" name="birthDate" value="${
            profileData?.Birthdate
          }" style="${inputStyle}">
      </div>

      <div>
          <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Gender</label>
          <div class="xircls-gender-option" style="display: flex; gap: 16px; margin-top: 8px;">
              <label style="display: flex; align-items: center;">
                  <input type="radio" name="gender" style="margin-right: 8px;" value="female" ${
                    profileData?.Gender === "female" ? "checked" : ""
                  }>
                  <span style="font-size: 14px;">Female</span>
              </label>
              <label style="display: flex; align-items: center;">
                  <input type="radio" name="gender" style="margin-right: 8px;" value="male" ${
                    profileData?.Gender === "male" ? "checked" : ""
                  }>
                  <span style="font-size: 14px;">Male</span>
              </label>
              <label style="display: flex; align-items: center;">
                  <input type="radio" name="gender" style="margin-right: 8px;" value="njon-binary" ${
                    profileData?.Gender === "non-binary" ? "checked" : ""
                  }>
                  <span style="font-size: 14px;">Non-binary</span>
              </label>
          </div>
      </div>

      

      
    </form>
  `;

    // Attach event listener to the profile form
    profileFormContainer
      .querySelector("#profileForm")
      .addEventListener("submit", function (event) {
        event.preventDefault();

        const form = event.target;
        const profileFormData = {};

        let firstName = "";
        let lastName = "";
        let gender = "";

        for (let i = 0; i < form.elements.length; i++) {
          const element = form.elements[i];

          if (element.name) {
            if (element.name === "firstName") {
              firstName = element.value;
              profileFormData[element.name] = element.value;
            } else if (element.name === "lastName") {
              lastName = element.value;
              profileFormData[element.name] = element.value;
            } else if (element.name === "gender") {
              if (element.checked) {
                gender = element.value;
                profileFormData[element.name] = element.value;
              }
            } else if (
              ["email", "phone", "birthDate", "phoneCode"].includes(
                element.name
              )
            ) {
              profileFormData[element.name] = element.value;
            } else if (
              [
                "emailNotifications",
                "smsNotifications",
                "productRecommendations",
              ].includes(element.name)
            ) {
              profileFormData[element.name] = element.checked;
            }
          }
        }

        profileFormData["name"] = firstName + " " + lastName;
        const functionToCallProf = getFunctionToCall(
          "Personal Information",
          cardData[0].id
        );
        functionToCallProf(profileFormData);

        console.log("profileFormData:", profileFormData);
      });

    return profileFormContainer;
  };

  // --- Render Address Forms ---
  const renderAddressForms = async () => {
    const addressFormsContainer = document.createElement("div");
    addressFormsContainer.id = "addressFormsContainer";
    const countriesData = await fetchCountries();
    console.log(countriesData, "conmtydata");

    // Process existing address forms
    for (let index = 0; index < addressDataArray.length; index++) {
      const addressData = addressDataArray[index];
      const addressId = addressData.id;
      const isDefault = addressData.default;
      console.log(addressData, "arrrrrrrrrrrrr");
      let contactName = "";
      let addressName = "";
      let relationship = "";

      if (
        addressMetafields &&
        addressMetafields.addressMeta &&
        Array.isArray(addressMetafields.addressMeta)
      ) {
        const matchingMeta = addressMetafields.addressMeta.find(
          (meta) => meta.address_id === addressData.id
        );

        if (matchingMeta) {
          contactName = matchingMeta.contact_name || "";
          addressName = matchingMeta.addressas || "";
          relationship = matchingMeta.relation || "";
        }
      }
      if (addressData.default) {
        contactName = profileData.Name || "";
        addressName = "Home";
        relationship = "Self";
      }

      const addressForm = document.createElement("form");
      addressForm.id = `addressForm_${index}`;
      addressForm.classList.add("xircls-address-form");
      addressForm.style.cssText =
        "border: 1px solid #ccc; padding: 16px; margin-bottom: 16px; position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; text-align: left;";

      const countryOptions = countriesData.success
        ? countriesData.data.countries.map(
            (country) =>
              `<option value="${country.name}" ${
                addressData?.country_name === country.name ? "selected" : ""
              }>${country.name}</option>`
          )
        : "<option>Error loading countries</option>";

      let stateOptions = "<option value=''>Select State</option>";
      if (addressData?.country_name) {
        const stateData = await fetchStates(addressData.country_name);
        console.log(stateData, "cityyyState");
        if (stateData?.success) {
          stateOptions += stateData.data.states
            .map(
              (state) =>
                `<option value="${state.name}" ${
                  addressData?.province === state.name ? "selected" : ""
                }>${state.name}</option>`
            )
            .join("");
        }
      }

      let cityOptions = "<option value=''>Select City</option>";
      if (addressData?.province) {
        const cityData = await fetchCities(addressData.province);
        console.log(cityData, "cityyyState");

        if (cityData?.success) {
          cityOptions += cityData.data.cities
            .map(
              (city) =>
                `<option value="${city.name}" ${
                  addressData?.city === city.name ? "selected" : ""
                }>${city.name}</option>`
            )
            .join("");
        }
      }

      const relationshipOptions = [
        "",
        "Father",
        "Mother",
        "Brother",
        "Sister",
        "Friend",
        "Neighbor",
        "Parent",
        "Self",
        "Child",
      ]
        .map(
          (rel) =>
            `<option value="${rel}" ${relationship === rel ? "selected" : ""}>${
              rel === "" ? "Select an option" : rel
            }</option>`
        )
        .join("");

      const addressNameDisplay = `
      <div class="address-name-display" style="font-size: 16px; font-weight: bold; margin-bottom: 8px; grid-column: 1 / -1;">
          ${addressName || ""}
      </div>
    `;
      addressForm.innerHTML = `
        
        <div style="position: absolute; top: 8px; right: 8px; display: flex; gap: 8px;">
            <button class="edit-address-btn" data-address-id="${addressId}" style="background: none; border: none; cursor: pointer;">
                <svg class="edit-address-icon" style="display:block;" stroke-width="0" viewBox="0 0 24 24" height="16px" width="16px" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M18.17 4.91 17.1 3.84l-5.55 5.55v1.08h1.08l5.54-5.56zM16 2.74l1.29-1.29a1.49 1.49 0 0 1 2.12 0l1.15 1.15c.59.59.59 1.54 0 2.12l-.68.68-.02.02-.58.58-6 6H10V8.74l6-6zm-2.28-.55-.55.55-1.27 1.27c-3.3.05-5.9 2.6-5.9 6.2 0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.79 6-9.14v-.1l1.8-1.8c.13.6.2 1.24.2 1.9 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8-8-11.8 0-4.98 3.8-8.2 8-8.2.58 0 1.16.06 1.72.18z"></path></svg>
          </button>
          
      </div>
      ${
        !addressData.default
          ? `<div style="position: absolute; top: 8px; right: 30px; display: flex; gap: 8px;">
            <button class="delete-address-btn" data-address-id="${addressId}" style="background: none; border: none; cursor: pointer;">
                <svg stroke="red" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="16px" width="16px" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="m432 144-28.67 275.74A32 32 0 0 1 371.55 448H140.46a32 32 0 0 1-31.78-28.26L80 144"></path><rect width="448" height="80" x="32" y="64" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" rx="16" ry="16"></rect><path fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M312 240 200 352m112 0L200 240"></path></svg>
          </button>

      </div>`
          : ``
      }
       ${!isEditMode(addressForm) ? addressNameDisplay : ""}
      <div style="display: flex; flex-direction: column;">
          <label for="addressName_${index}" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Address Name</label>
          <input type="text" id="addressName_${index}" name="addressName" value="${
        addressName || ""
      }" style="${inputStyle}" data-address-id="${addressId}" ${
        isDefault ? "disabled" : "disabled"
      }>
      </div>

      <div style="display: flex; flex-direction: column;">
          <label for="relationship_${index}" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Relationship</label>
          <select id="relationship_${index}" name="relationship" style="${inputStyle}" data-address-id="${addressId}" ${
        isDefault ? "disabled" : "disabled"
      }>
              ${relationshipOptions}
          </select>
      </div>

      <div style="display: flex; flex-direction: column;">
          <label for="contactName_${index}" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Contact Name</label>
          <input type="text" id="contactName_${index}" name="contactName" value="${
        contactName || ""
      }" style="${inputStyle}" data-address-id="${addressId}" ${
        isDefault ? "disabled" : "disabled"
      }>
      </div>

      <div style="display: flex; flex-direction: column;">
          <label for="addressLine1_${index}" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Address Line 1</label>
          <input type="text" id="addressLine1_${index}" name="addressLine1" value="${
        addressData?.address1 || ""
      }" style="${inputStyle}" data-address-id="${addressId}" disabled>
      </div>

      <div style="display: flex; flex-direction: column;">
          <label for="addressLine2_${index}" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Address Line 2</label>
          <input type="text" id="addressLine2_${index}" name="addressLine2" value="${
        addressData?.address2 || ""
      }" style="${inputStyle}" data-address-id="${addressId}" disabled>
      </div>

      <div style="display: flex; flex-direction: column;">
          <label for="country_${index}" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Country</label>
          <select id="country_${index}" name="country" style="${inputStyle}" data-address-id="${addressId}" disabled>
              <option value="">Select Country</option>
              ${countryOptions}
          </select>
      </div>

      <div style="display: flex; flex-direction: column;">
          <label for="state_${index}" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">State/Province</label>
          <select id="state_${index}" name="state" style="${inputStyle}" data-address-id="${addressId}" disabled>
           ${stateOptions}
        </select>
      </div>

      <div style="display: flex; flex-direction: column;">
          <label for="city_${index}" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">City</label>
          <select id="city_${index}" name="city" style="${inputStyle}" data-address-id="${addressId}" disabled>
          ${cityOptions}
        </select>
      </div>

      <div style="display: flex; flex-direction: column;">
          <label for="zip_${index}" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">ZIP/Postal Code</label>
          <input type="text" id="zip_${index}" name="zip" value="${
        addressData?.zip || ""
      }" style="${inputStyle}" data-address-id="${addressId}" disabled>
      </div>
<div style="display: flex; gap: 16px; justify-content: flex-end;">
<button class="cancel-edit-address-btn" data-address-id="${addressId}" style="background-color: black; color: white; padding: 8px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; transition: background-color 0.3s ease; border: none; cursor: pointer; margin-top: 16px;grid-column:2; margin-left: auto; display: none;">
              Cancel
          </button>
      <button type="submit" style="background-color: black; color: white; padding: 8px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; transition: background-color 0.3s ease; border: none; cursor: pointer; margin-top: 16px;grid-column:2;">Save Address</button>
      
          </div>
    `;
      if (!addressData.default) {
        addressForm
          .querySelector(`.delete-address-btn[data-address-id="${addressId}"]`)
          .addEventListener("click", function (event) {
            event.preventDefault();
            deleteCustomerAddress(addressId);
          });
      }
      // Add dynamic event listeners for country and state changes
      const countrySelect = addressForm.querySelector(`#country_${index}`);
      const stateSelect = addressForm.querySelector(`#state_${index}`);
      const citySelect = addressForm.querySelector(`#city_${index}`);

      // Country change event
      countrySelect.addEventListener("change", async function () {
        if (this.disabled) return; // Only work when form is in edit mode

        const selectedCountry = this.options[this.selectedIndex].text;
        console.log("Country changed:", selectedCountry);

        // Reset state and city
        stateSelect.innerHTML = "<option value=''>Select State</option>";
        citySelect.innerHTML = "<option value=''>Select City</option>";

        if (selectedCountry && selectedCountry !== "Select Country") {
          try {
            const stateData = await fetchStates(selectedCountry);
            if (stateData?.success) {
              const newStateOptions = stateData.data.states
                .map(
                  (state) =>
                    `<option value="${state.name}">${state.name}</option>`
                )
                .join("");
              stateSelect.innerHTML =
                "<option value=''>Select State</option>" + newStateOptions;
            }
          } catch (error) {
            console.error("Error fetching states:", error);
          }
        }
      });

      // State change event
      stateSelect.addEventListener("change", async function () {
        if (this.disabled) return; // Only work when form is in edit mode

        const selectedState = this.value;
        console.log("State changed:", selectedState);

        // Reset city
        citySelect.innerHTML = "<option value=''>Select City</option>";

        if (selectedState) {
          try {
            const cityData = await fetchCities(selectedState);
            if (cityData?.success) {
              const newCityOptions = cityData.data.cities
                .map(
                  (city) => `<option value="${city.name}">${city.name}</option>`
                )
                .join("");
              citySelect.innerHTML =
                "<option value=''>Select City</option>" + newCityOptions;
            }
          } catch (error) {
            console.error("Error fetching cities:", error);
          }
        }
      });

      // Edit button event listener
      addressForm
        .querySelector(".edit-address-btn")
        .addEventListener("click", function (event) {
          event.preventDefault();

          const button = this;
          const addressId = button.dataset.addressId;
          const svgElement = button.querySelector("svg.edit-address-icon");

          if (svgElement) {
            enableAddressEdit(addressForm, addressId, isDefault);
            svgElement.style.display = "none";
            addressForm.querySelector(
              `.cancel-edit-address-btn[data-address-id="${addressId}"]`
            ).style.display = "inline-block";
            const addressNameDiv = addressForm.querySelector(
              ".address-name-display"
            );
            if (addressNameDiv) {
              addressNameDiv.style.display = "none";
            }
          } else {
            console.warn("SVG element not found inside edit button!");
          }
        });

      // Cancel button event listener
      addressForm
        .querySelector(".cancel-edit-address-btn")
        .addEventListener("click", function (event) {
          event.preventDefault();
          const addressId = this.dataset.addressId;

          disableAddressEdit(addressForm, addressId, isDefault);
          this.style.display = "none";

          const editButton = addressForm.querySelector(
            `.edit-address-btn[data-address-id="${addressId}"]`
          );
          editButton.disabled = false;
          const svgElement = editButton.querySelector("svg.edit-address-icon");
          if (svgElement) {
            svgElement.style.display = "block";
          }
          const addressNameDiv = addressForm.querySelector(
            ".address-name-display"
          );
          if (addressNameDiv) {
            addressNameDiv.style.display = "block";
          }
        });

      // Form submission event listener
      addressForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const form = event.target;
        const addressFormData = {};

        for (let i = 0; i < form.elements.length; i++) {
          const element = form.elements[i];
          if (element.name && element.name !== "submit") {
            addressFormData[element.name] = element.value;
          }
        }
        console.log(addressFormData, "dataaaaaaaaaaaaa");

        // Call the function to save/update address (pass addressId if it exists)
        const functionToCallAddress = getFunctionToCall(
          "Shipping Information",
          addressId // Pass addressId for existing addresses, null for new
        );
        functionToCallAddress(addressFormData);
      });

      addressFormsContainer.appendChild(addressForm);
    }

    return addressFormsContainer;
  };

  // Helper functions to enable/disable address input fields
  function enableAddressEdit(form, addressId, isDefault) {
    const addressInputs = form.querySelectorAll(
      `input[data-address-id="${addressId}"], select[data-address-id="${addressId}"]`
    );
    addressInputs.forEach((input) => {
      if (
        isDefault &&
        (input.name === "addressName" ||
          input.name === "relationship" ||
          input.name === "contactName")
      ) {
        input.disabled = true; // Keep these disabled if it's the default address
      } else {
        input.disabled = false; // Otherwise, enable them
      }
    });
  }

  function disableAddressEdit(form, addressId, isDefault) {
    const addressInputs = form.querySelectorAll(
      `input[data-address-id="${addressId}"], select[data-address-id="${addressId}"]`
    );
    addressInputs.forEach((input) => {
      if (
        isDefault &&
        (input.name === "addressName" ||
          input.name === "relationship" ||
          input.name === "contactName")
      ) {
        input.disabled = true;
      } else {
        input.disabled = true;
      }
    });
  }

  const renderAddAddressForm = async () => {
    const addressForm = document.createElement("form");
    addressForm.id = "addAddressForm";
    addressForm.classList.add("xircls-address-form");
    addressForm.style.cssText =
      "border: 1px solid #ccc; padding: 16px; margin-bottom: 16px; position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; text-align: left;";

    const countriesData = await fetchCountries();

    const countryOptions = countriesData.success
      ? countriesData.data.countries.map(
          (country) =>
            `<option value="${country.name}">${country.name}</option>`
        )
      : "<option>Error loading countries</option>";

    const relationshipOptions = [
      "",
      "Father",
      "Mother",
      "Brother",
      "Sister",
      "Friend",
      "Neighbor",
      "Parent",
      "Self",
      "Child",
    ]
      .map(
        (rel) =>
          `<option value="${rel}">${
            rel === "" ? "Select an option" : rel
          }</option>`
      )
      .join("");

    addressForm.innerHTML = `
  <div style="display: flex; flex-direction: column;">
      <label for="addressName_new" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Address Name</label>
      <input type="text" id="addressName_new" name="addressName" style="${inputStyle}">
  </div>

  <div style="display: flex; flex-direction: column;">
      <label for="relationship_new" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Relationship</label>
      <select id="relationship_new" name="relationship" style="${inputStyle}">
          ${relationshipOptions}
      </select>
  </div>

  <div style="display: flex; flex-direction: column;">
      <label for="contactName_new" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Contact Name</label>
      <input type="text" id="contactName_new" name="contactName" style="${inputStyle}">
  </div>

  <div style="display: flex; flex-direction: column;">
      <label for="addressLine1_new" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Address Line 1</label>
      <input type="text" id="addressLine1_new" name="addressLine1" style="${inputStyle}">
  </div>

  <div style="display: flex; flex-direction: column;">
      <label for="addressLine2_new" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Address Line 2</label>
      <input type="text" id="addressLine2_new" name="addressLine2" style="${inputStyle}">
  </div>

  <div style="display: flex; flex-direction: column;">
      <label for="country_new" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">Country</label>
      <select id="country_new" name="country" style="${inputStyle}">
          <option value="">Select Country</option>
          ${countryOptions}
      </select>
  </div>

  <div style="display: flex; flex-direction: column;">
      <label for="state_new" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">State/Province</label>
      <select id="state_new" name="state" style="${inputStyle}">
          <option value="">Select State</option>
      </select>
  </div>

  <div style="display: flex; flex-direction: column;">
      <label for="city_new" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">City</label>
      <select id="city_new" name="city" style="${inputStyle}">
            <option value="">Select City</option>
        </select>
    </div>

    <div style="display: flex; flex-direction: column;">
        <label for="zip_new" style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px;">ZIP/Postal Code</label>
        <input type="text" id="zip_new" name="zip" style="${inputStyle}">
    </div>

    <div style="display: flex; gap: 16px; justify-content: flex-end; grid-column: 1 / -1;">
    <button type="button" class="cancel-add-address" style="background-color: black; color: white; padding: 8px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; transition: background-color 0.3s ease; border: none; cursor: pointer;">Cancel</button>
    <button type="submit" style="background-color: black; color: white; padding: 8px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; transition: background-color 0.3s ease; border: none; cursor: pointer;">Add Address</button>
</div>

  
    `;

    // Event listener for country change (to load states)
    addressForm
      .querySelector(`#country_new`)
      .addEventListener("change", async function () {
        const selectedCountry = this.value;
        const stateSelect = addressForm.querySelector(`#state_new`);
        const citySelect = addressForm.querySelector(`#city_new`);

        // Reset state and city
        stateSelect.innerHTML = "<option value=''>Select State</option>";
        citySelect.innerHTML = "<option value=''>Select City</option>";

        if (selectedCountry && selectedCountry !== "Select Country") {
          try {
            const stateData = await fetchStates(selectedCountry);
            if (stateData?.success) {
              const newStateOptions = stateData.data.states
                .map(
                  (state) =>
                    `<option value="${state.name}">${state.name}</option>`
                )
                .join("");
              stateSelect.innerHTML =
                "<option value=''>Select State</option>" + newStateOptions;
            }
          } catch (error) {
            console.error("Error fetching states:", error);
          }
        }
      });

    // Event listener for state change (to load cities)
    addressForm
      .querySelector(`#state_new`)
      .addEventListener("change", async function () {
        const selectedState = this.value;
        const citySelect = addressForm.querySelector(`#city_new`);

        citySelect.innerHTML = "<option value=''>Select City</option>";

        if (selectedState) {
          try {
            const cityData = await fetchCities(selectedState);
            if (cityData?.success) {
              const newCityOptions = cityData.data.cities
                .map(
                  (city) => `<option value="${city.name}">${city.name}</option>`
                )
                .join("");
              citySelect.innerHTML =
                "<option value=''>Select City</option>" + newCityOptions;
            }
          } catch (error) {
            console.error("Error fetching cities:", error);
          }
        }
      });

    // Form submission event listener
    addressForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const form = event.target;
      const addressFormData = {};

      for (let i = 0; i < form.elements.length; i++) {
        const element = form.elements[i];
        if (element.name && element.name !== "submit") {
          addressFormData[element.name] = element.value;
        }
      }

      const functionToCallAddress = getFunctionToCall("Shipping Information");
      functionToCallAddress(addressFormData);

      addressFormsContainer.removeChild(addressForm);
    });

    // Cancel button event listener
    addressForm
      .querySelector(".cancel-add-address")
      .addEventListener("click", function (event) {
        event.preventDefault();
        addressFormsContainer.removeChild(addressForm);
      });

    return addressForm;
  };

  // Helper functions to enable/disable address input fields
  function enableAddressEdit(form, addressId, isDefault) {
    const addressInputs = form.querySelectorAll(
      `input[data-address-id="${addressId}"], select[data-address-id="${addressId}"]`
    );
    addressInputs.forEach((input) => {
      if (
        isDefault &&
        (input.name === "addressName" ||
          input.name === "relationship" ||
          input.name === "contactName")
      ) {
        input.disabled = true; // Keep these disabled if it's the default address
      } else {
        input.disabled = false; // Otherwise, enable them
      }
    });
  }

  function disableAddressEdit(form, addressId, isDefault) {
    const addressInputs = form.querySelectorAll(
      `input[data-address-id="${addressId}"], select[data-address-id="${addressId}"]`
    );
    addressInputs.forEach((input) => {
      if (
        isDefault &&
        (input.name === "addressName" ||
          input.name === "relationship" ||
          input.name === "contactName")
      ) {
        input.disabled = true;
      } else {
        input.disabled = true;
      }
    });
  }

  // Helper function to check if form is in edit mode
  function isEditMode(form) {
    return (
      form.querySelector(
        "input[data-address-id]:not([disabled]), select[data-address-id]:not([disabled])"
      ) !== null
    );
  }

  // --- Render Everything ---
  const mainContainer = document.createElement("div");
  mainContainer.appendChild(renderProfileForm());

  const addressHeadingContainer = document.createElement("div");
  addressHeadingContainer.style.cssText =
    "font-size: 18px; margin-bottom: 16px; color: black; margin-top: 24px; display: flex; justify-content: space-between; align-items: center;";

  const addressHeading = document.createElement("div");
  addressHeading.textContent = "Address Information"; // Changed the heading text
  addressHeadingContainer.appendChild(addressHeading);

  const addAddressButton = document.createElement("button");
  addAddressButton.textContent = "+ Add Address";
  addAddressButton.style.cssText =
    "background-color: black; color: white; padding: 8px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; transition: background-color 0.3s ease; border: none; cursor: pointer;";
  addAddressButton.addEventListener("click", async () => {
    const newAddressForm = await renderAddAddressForm();
    addressFormsContainer.appendChild(newAddressForm);
  });
  addressHeadingContainer.appendChild(addAddressButton);

  mainContainer.appendChild(addressHeadingContainer);

  const addressFormsContainerElement = await renderAddressForms();
  mainContainer.appendChild(addressFormsContainerElement);
  const messgContainerContent = `<div style="grid-column: 1 / span 2; margin-top: 24px; margin-bottom: 16px; text-align: left;">
          <div style="font-size: 18px; margin-bottom: 16px; color: black;">Communication Preferences</div>
      </div>

      <div style="grid-column: 1 / span 2; text-align: left;">
          <label style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <input type="checkbox" name="emailNotifications" style="margin-top: 4px; margin-right: 12px;" checked>
              <div>
                  <span style="font-size: 14px; display: block; margin-bottom: 4px;">Email Notifications</span>
                  <span style="font-size: 12px; color: #6b7280;">Receive emails about new products, exclusive offers, and beauty tips.</span>
              </div>
          </label>

          <label style="display: flex; align-items: flex-start; margin-bottom: 12px;">
              <input type="checkbox" name="smsNotifications" style="margin-top: 4px; margin-right: 12px;" checked>
              <div>
                  <span style="font-size: 14px; display: block; margin-bottom: 4px;">SMS Notifications</span>
                  <span style="font-size: 12px; color: #6b7280;">Receive text messages about your orders and special promotions.</span>
              </div>
          </label>

          <label style="display: flex; align-items: flex-start;">
              <input type="checkbox" name="productRecommendations" style="margin-top: 4px; margin-right: 12px;">
              <div>
                  <span style="font-size: 14px; display: block; margin-bottom: 4px;">Product Recommendations</span>
                  <span style="font-size: 12px; color: #6b7280;">Allow us to personalize your shopping experience based on your preferences.</span>
              </div>
          </label>
      </div>`
      const messgContainer = document.createElement('div')
      messgContainer.innerHTML = messgContainerContent;
      mainContainer.appendChild(messgContainer)
  profileContainer.appendChild(mainContainer);
}

async function fetchWishlist() {
  try {
    const response = await fetch("/your-api-endpoint");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`); // Handle HTTP errors
    }
    const data = await response.json();
    console.log("Raw data from fetchWishlist:", data);
    return data;
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return null; // Or some default value in case of an error
  }
}
async function saveReminder(data, item) {
  const { id: metafieldId, wishlist } = await fetchWishlist();

  if (!customerId || !metafieldId) {
    createStatusToast(
      "Reminder Failed",
      "We couldn’t edit your reminder. Please try again or contact support for assistance.",
      "error"
    );
    return;
  }

  // Clone and prepare updated wishlist
  const updatedWishlist = Array.isArray(wishlist) ? [...wishlist] : [];

  // Check if item already exists by id
  const existingIndex = updatedWishlist.findIndex((w) => w.id === item.id);

  const itemWithReminder = {
    ...item,
    reminderDate: `${data.date} ${data.time}`,
  };

  if (existingIndex !== -1) {
    // Update existing item
    updatedWishlist[existingIndex] = itemWithReminder;
  } else {
    // Add new item
    updatedWishlist.push(itemWithReminder);
  }

  const payload = {
    customerId,
    customer_name: prof_name,
    shop: Shopify.shop,
    app: "oh_my_customer",
    metafieldId,
    email: profile_email,
    caltime: data.time,
    caldate: data.date,
    productId: item.id,
    metafield: {
      id: metafieldId,
      namespace: "wishlist",
      key: "items",
      value: JSON.stringify(updatedWishlist),
      type: "json",
    },
  };

  try {
    const response = await fetch(
      `https://${baseUrl}/api/v1/update_metafield/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const resData = await response.json();

    if (!response.ok) {
      throw new Error(`Error saving wishlist: ${resData.message}`);
    }

    createStatusToast(
      `Reminder Scheduled`,
      "We'll notify you about this item on your chosen date and time.",
      "success"
    );
  } catch (error) {
    console.error("Error saving reminder:", error);
  }
}
async function injectReminderModal(item) {
  console.log("rendering the Reminder modal");
  const modal = renderCalendarUI(item.name);
  document.body.appendChild(modal);

  // Wait for the reminderSet event
  reminderData = await new Promise((resolve) => {
    const handler = (e) => {
      document.removeEventListener("reminderSet", handler);
      resolve(e.detail); // { date, time }
    };
    document.addEventListener("reminderSet", handler);
  });

  if (reminderData) {
    console.log(reminderData, item);
    saveReminder(reminderData, item);
  }
}
async function injectEditReminderModal(item, id) {
  console.log("rendering the Reminder modal");
  const modal = renderCalendarUI(item.name);
  document.body.appendChild(modal);

  // Wait for the reminderSet event
  reminderData = await new Promise((resolve) => {
    const handler = (e) => {
      document.removeEventListener("reminderSet", handler);
      resolve(e.detail); // { date, time }
    };
    document.addEventListener("reminderSet", handler);
  });

  if (reminderData) {
    console.log(reminderData, item);
    saveEditReminder(reminderData, item, id);
  }
}
async function saveEditReminder(data, item, reminder_id) {
  const { id: metafieldId, wishlist } = await fetchWishlist();

  if (!customerId || !metafieldId) {
    createStatusToast(
      "Reminder Failed",
      "We couldn’t edit your reminder. Please try again or contact support for assistance.",
      "error"
    );
    return;
  }

  // Clone and prepare updated wishlist
  const updatedWishlist = Array.isArray(wishlist) ? [...wishlist] : [];

  // Check if item already exists by id
  const existingIndex = updatedWishlist.findIndex((w) => w.id === item.id);

  const itemWithReminder = {
    ...item,
    reminderDate: `${data.date} ${data.time}`,
  };

  if (existingIndex !== -1) {
    // Update existing item
    updatedWishlist[existingIndex] = itemWithReminder;
  } else {
    // Add new item
    updatedWishlist.push(itemWithReminder);
  }

  const payload = {
    customerId,
    customer_name: prof_name,
    shop: Shopify.shop,
    app: "oh_my_customer",
    metafieldId,
    email: profile_email,

    productId: item.id,
    metafield: {
      id: metafieldId,
      namespace: "wishlist",
      key: "items",
      value: JSON.stringify(updatedWishlist),
      type: "json",
    },
  };

  try {
    const response = await fetch(
      `https://${baseUrl}/api/v1/update_metafield/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const resData = await response.json();

    if (!response.ok) {
      throw new Error(`Error saving wishlist: ${resData.message}`);
    }
    const payloadUpt = {
      caltime: data.time,
      caldate: data.date,
      reminderId: reminder_id,
    };
    await fetch(`https://${baseUrl}/api/v1/update_task/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadUpt),
    });

    createStatusToast(
      `Reminder Scheduled`,
      "We'll notify you about this item on your chosen date and time.",
      "success"
    );
  } catch (error) {
    console.error("Error saving reminder:", error);
  } finally {
    setTimeout(() => window.location.reload(), 500);
  }
}
async function editReminder(item) {
  const removeId = await getReminderData(item.id);
  injectEditReminderModal(item, removeId[0].id);
}
async function removeReminder(item) {
  const removeId = await getReminderData(item.id);
  console.log(removeId, "iddddd");
  const removeUrl = `https://${baseUrl}/api/v1/delete_task/`;
  const payload = {
    reminderId: removeId[0].id,
  };
  try {
    const response = await fetch(removeUrl, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log("Response from server:", data);
    const { id, wishlist } = await fetchWishlist();
    wishlist.forEach((items) => {
      if (items.id === item.id) {
        console.log(items.reminderDate, "wishlistttttttttttRemove");
        delete items.reminderDate;
        console.log(items.reminderDate, "withoutdate");
      }
    });
    console.log(wishlist, "updatedWishloist");

    const payloadUpdt = {
      customerId: customerId,
      customer_name: prof_name,
      shop: Shopify.shop,
      app: "oh_my_customer",
      metafieldId: id,
      email: profile_email,
      productId: item.id,
      metafield: {
        id: id,
        namespace: "wishlist",
        key: "items",
        value: JSON.stringify(wishlist),
        type: "json",
      },
    };
    const response1 = await fetch(
      `https://${baseUrl}/api/v1/update_metafield/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadUpdt),
      }
    );
    const data1 = await response1.json();

    if (!response.ok) {
      throw new Error(`Error saving wishlist: ${data1.message}`);
    }
    console.log("Wishlist successfully saved to metafield:", wishlist);
  } catch (error) {
    console.log(error);
  } finally {
    setTimeout(() => window.location.reload(), 500);
  }
}
async function getReminderData(id) {
  const url = "https://omc.axentraos.co.in/get_reminder_id/";
  const formData = new FormData();
  // formData.append("app", "oh_my_customer");
  formData.append("shop", Shopify.shop);
  formData.append("email", profile_email);
  formData.append("productId", id);
  payload = {
    shop: Shopify.shop,
    email: profile_email,
    productId: id,
  };
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log("Response from server:", data);
    return data;
  } catch (error) {
    console.log(error);
  }
}
async function renderWishlist() {
  const wishlistContainer = document.getElementById("wishListsContainer");
  const wishlist = await fetchWishlist();
  console.log(wishlist, "data-wish");

  //Check that the wishlist object has a 'wishlistItems' property, that is an array and has more than 0 items
  if (
    !wishlist ||
    !wishlist.wishlist ||
    !Array.isArray(wishlist.wishlist) ||
    wishlist.wishlist.length === 0
  ) {
    const wishlistEmptyCard = createEmptyCard("wishlist");
    wishlistContainer.innerHTML = wishlistEmptyCard;
    return;
  }

  // Store the original wishlist for filtering
  let currentWishlist = wishlist.wishlist;

  // Function to handle search
  const handleSearch = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    currentWishlist = wishlist.wishlist.filter((item) =>
      item.name.toLowerCase().includes(searchTerm)
    );
    // Re-render with filtered items
    renderWishlistItems(currentWishlist, searchTerm);
  };

  // Function to render wishlist items
  const renderWishlistItems = (items, searchTerm = "") => {
    // Pass searchTerm

    let wishlistItemsHTML = ""; // Initialize to empty string

    if (items.length === 0) {
      wishlistItemsHTML = createEmptyCard("wishlist", searchTerm);
    } else {
      wishlistItemsHTML = items
        .map((item) => {
          let formattedDate = "Invalid Date";

          try {
            const reminderDate = new Date(item.reminderDate);
            if (isNaN(reminderDate.getTime())) {
              console.error("Invalid reminder date:", item.reminderDate);
            } else {
              const monthNames = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ];
              const day = reminderDate.getDate();
              const month = monthNames[reminderDate.getMonth()];
              const year = reminderDate.getFullYear();

              // Get the time in AM/PM format
              let hours = reminderDate.getHours();
              const minutes = reminderDate.getMinutes();
              const ampm = hours >= 12 ? "PM" : "AM";
              hours = hours % 12;
              hours = hours ? hours : 12; // the hour '0' should be '12'
              const minutesStr = minutes < 10 ? "0" + minutes : minutes; // Add leading zero to minutes if needed

              const formattedTime = `${hours}:${minutesStr} ${ampm}`;
              formattedDate = `${month} ${day}, ${year} ${formattedTime}`;
            }
          } catch (error) {
            console.error("Error formatting date:", error);
          }

          return ` <div class="item-card" style="border-radius: 8px; border: 1px solid #e5e7eb; background-color: white; color: black; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); overflow: hidden; height: 100%; display: flex; flex-direction: column;">
                <div style="position: relative; overflow: hidden; height: 200px;">
                    <div style="position: absolute; top: 12px; right: 12px; z-index: 2; display: flex; flex-direction: column; gap: 8px;">
                        <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; height: 32px; width: 32px; border-radius: 50%; background-color: rgba(255, 255, 255, 0.8); border: none;cursor: pointer;"onclick="removeFromWishlist(${
                          item.id
                        })">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                 stroke-linejoin="round" style="height: 16px; width: 16px; color: #374151;">
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                            </svg>
                        </button>
                        
                    </div>
                    <div  style="position: absolute; top: 12px; left: 12px; z-index: 2; display: flex; flex-direction: column; gap: 8px;">
                        ${
                          item.reminderDate
                            ? `<div style="display: inline-flex; align-items: center; border-radius: 9999px; border: 1px solid transparent; padding: 2px 10px; font-size: 12px; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; background-color: #e2e8f0; color: #374151; ">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                 stroke-linejoin="round" style="height: 12px; width: 12px; margin-right: 4px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${formattedDate}
                        </div>`
                            : ""
                        }
                    </div>
                    <img src="${item.image}"
                         alt="${item.name}"
                         class="item-card-image">
                </div>

                <div style="padding: 24px; flex-grow: 1; padding-top: 16px; text-align: left">
                    <h4 style="  font-size: 16px; margin-bottom: 4px;">${
                      item.name
                    }</h4>
                    <div style="font-size: 14px; color: #6b7280; margin-bottom: 12px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                        ${item.type ? item.type : ""}
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div style="font-weight: 500;">${item.price}</div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="display: flex; align-items: center;">
                                <span style="width: 16px; height: 16px; border-radius: 50%; border: 1px solid #e5e7eb; margin-right: 4px; background-color: rgb(227, 188, 122);"
                                      title="Shade: 4.5"></span>
                                <span style="font-size: 12px; color: #6b7280;">4.5</span>
                            </div>
                        </div>
                    </div>
                     <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px;">
                        ${
                          item.reminderDate
                            ? `<button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; border: 1px solid #e5e7eb; background-color: white; height: 36px; border-radius: 4px; padding-left: 12px; padding-right: 12px; flex: 1; font-size: 12px; cursor: pointer;" onclick='injectEditReminderModal(${JSON.stringify(
                                item
                              )})'>
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="14px" width="14px" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 22H5a2 2 0 0 1-2-2l.01-14c0-1.1.88-2 1.99-2h1V2h2v2h8V2h2v2h1c1.1 0 2 .9 2 2v6h-2v-2H5v10h7v2zm10.13-5.01.71-.71a.996.996 0 0 0 0-1.41l-.71-.71a.996.996 0 0 0-1.41 0l-.71.71 2.12 2.12zm-.71.71-5.3 5.3H14v-2.12l5.3-5.3 2.12 2.12z"></path></svg>
                            Edit Reminder
                        </button>
                        <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; border: 1px solid #e5e7eb; background-color: white; height: 36px; border-radius: 4px; padding-left: 12px; padding-right: 12px; flex: 1; font-size: 12px; cursor: pointer;" onclick='removeReminder(${JSON.stringify(
                          item
                        )})'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                 stroke-linejoin="round" style="height: 14px; width: 14px; margin-right: 6px;">
                                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                                <path d="m2 2 20 20"></path>

                    </svg>
                    Cancel Reminder
                        </button>`
                            : `<button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; border: 1px solid #e5e7eb; background-color: white; height: 36px; border-radius: 4px; padding-left: 12px; padding-right: 12px; flex-grow: 1; font-size: 12px; cursor: pointer;" onclick='injectReminderModal(${JSON.stringify(
                                item
                              )})'>
                            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="14px" width="14px" xmlns="http://www.w3.org/2000/svg"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    Add Reminder
                        </button>`
                        }
                </div>
                  </div>

                  <div style="display: flex; align-items: center; padding: 24px; flex-direction: column; gap: 8px; padding-top: 0;">
                    <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; border-radius: 4px; font-size: 14px; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; height: 40px; padding-left: 16px; padding-right: 16px; width: 100%; background-color: black; color: white; cursor: pointer; border: none;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 16px; width: 16px; margin-right: 8px;">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                        <path d="M3 6h18"></path>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                      Buy Now
                    </button>
                    <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; border-radius: 4px; font-size: 14px; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; border: 1px solid #e5e7eb; background-color: white; height: 40px; padding-left: 16px; padding-right: 16px; width: 100%; cursor: pointer;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 16px; width: 16px; margin-right: 8px;">
                        <circle cx="8" cy="21" r="1"></circle>
                        <circle cx="19" cy="21" r="1"></circle>
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                      </svg>
                      Add to Cart
                    </button>
                  </div>
              </div>
            `;
        })
        .join("");
    }

    const wishlistItemsContainer = document.getElementById(
      "wishlistItemsContainer"
    );
    wishlistItemsContainer.innerHTML = wishlistItemsHTML;
    if (items.length === 0) {
      wishlistItemsContainer.style.display = "block";
    } else {
      wishlistItemsContainer.style.display = "grid";
    }
  };

  const wishlistContent = `
        <div style="position: relative; height: 260px; margin-bottom: 32px; overflow: hidden; border-radius: 4px;">
            <img src="https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
                 alt="Your Favorites"
                 style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; inset: 0; background: linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4)); display: flex; flex-direction: column; justify-content: center; padding-left: 32px; padding-right: 32px; color: white; text-align: left;">
                <div style="  font-size: 24px; margin-bottom: 8px;">Your Favorites</div>
                <div style="font-size: 14px; max-width: 512px;">Save your most desired Armani Beauty products</div>
            </div>
        </div>

        <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: center; gap: 16px; margin-top: 24px; margin-bottom: 24px; ">
            
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px; width: 100%;">
            <div style="display: flex; align-items: center; gap: 8px; margin-right: 10px">
                <div style="font-size: 14px;">You have <span style="font-weight: 500;">${wishlist.wishlist.length}</span> items in your wishlist</div>
            </div>
                <div style="position: relative; flex-grow: 1;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         style="position: absolute; left: 12px; top: 8px; height: 16px; width: 16px; color: #6b7280;">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.3-4.3"></path>
                    </svg>
                    <input type="search" placeholder="Search wishlist"
                           style="display: flex; height: 40px; width: 100%; border-radius: 4px; border: 1px solid #e5e7eb; background-color: white; padding-left: 40px; padding-right: 12px; font-size: 14px; outline: none;" id="wishlistSearch">
                </div>
                <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; border: 1px solid #e5e7eb; background-color: white; height: 36px; border-radius: 4px; padding-left: 12px; padding-right: 12px; margin-right: auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         style="height: 16px; width: 16px; margin-right: 8px;">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
                        <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
                    </svg>
                    Share Wishlist
                </button>
                <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; height: 36px; border-radius: 4px; padding-left: 12px; padding-right: 12px; margin-right: auto; background-color: black; color: white;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         style="height: 16px; width: 16px; margin-right: 8px;">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                        <path d="M3 6h18"></path>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    Buy All
                </button>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; " id="wishlistItemsContainer">
        </div>
    `;

  wishlistContainer.innerHTML = wishlistContent;

  // Add event listener to the search input
  document
    .getElementById("wishlistSearch")
    .addEventListener("input", handleSearch);

  // Initial render of wishlist items
  renderWishlistItems(currentWishlist);
}
function renderOrders(customerOrders) {
  const ordersContainer = document.getElementById("ordersContainer");

  if (!ordersContainer) {
    console.error("Error: ordersContainer not found in the document.");
    return;
  }

  // Keep original orders for filtering
  let filteredOrders = [...customerOrders];

  // Helper function to format dates consistently for comparison
  const formatDateForComparison = (dateString) => {
    return new Date(dateString).getTime();
  };

  // Function to apply all active filters
  const applyFilters = () => {
    const searchQuery = document
      .getElementById("orderSearch")
      .value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    const dateFilter = document.getElementById("dateFilter").value;

    // Start with all orders
    let result = [...customerOrders];

    // Apply search filter (by order number or product name)
    if (searchQuery) {
      result = result.filter((order) => {
        // Check if order number contains the search query
        if (order.orderNumber.toString().toLowerCase().includes(searchQuery)) {
          return true;
        }

        // Check if any product title contains the search query
        return order.items.some((item) =>
          item.title.toLowerCase().includes(searchQuery)
        );
      });
    }

    // Apply status filter
    if (statusFilter && statusFilter !== "All Orders") {
      result = result.filter(
        (order) => order.fulfillmentStatus === statusFilter
      );
    }

    // Apply date filter
    if (dateFilter && dateFilter !== "All Time") {
      const now = new Date();
      let cutoffDate = new Date();

      if (dateFilter === "Last 30 days") {
        cutoffDate.setDate(cutoffDate.getDate() - 30);
      } else if (dateFilter === "Last 6 Months") {
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
      } else if (dateFilter === "Last 12 Months") {
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
      }

      result = result.filter(
        (order) =>
          formatDateForComparison(order.orderDate) >= cutoffDate.getTime()
      );
    }

    return result;
  };






  //******************ORDERCARD HTML STARTS*******************************/

  const eyeIcon = `
<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="3"></circle>
  <path d="M2 12s4-7 10-7 10 7 10 7"></path>
</svg>`;

const reorderIcon = `
<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 12a9 9 0 1 0 9-9"></path>
  <path d="M3 3v5h5"></path>
</svg>`;

const starIcon = `
<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8"></polygon>
</svg>`;

const returnIcon = `
<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 14 4 9l5-5"></path>
  <path d="M4 9h10.5a5.5 5.5 0 1 1 0 11H11"></path>
</svg>`;

const exchangeIcon = `
<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m16 3 4 4-4 4"></path>
  <path d="M20 7H4"></path>
  <path d="m8 21-4-4 4-4"></path>
  <path d="M4 17h16"></path>
</svg>`;


// reorder button

function showLoader() {
  document.body.classList.add("omc-loading");
}

function hideLoader() {
  document.body.classList.remove("omc-loading");
}

window.openReorderModal = async function (encodedOrder) {
  let orderData;

  try {
    orderData = JSON.parse(decodeURIComponent(encodedOrder));
  } catch (e) {
    console.error("❌ Reorder parse error:", e);
    createStatusToast("Reorder Failed", "Invalid order data", "error");
    return;
  }

  // ✅ FIX: use correct key
  const items = orderData?.items;

  if (!Array.isArray(items) || items.length === 0) {
    createStatusToast(
      "Reorder Failed",
      "No items found in this order",
      "error"
    );
    return;
  }

  const confirmReorder = confirm(
    `Reorder items from Order #${orderData.orderNumber}?`
  );
  if (!confirmReorder) return;

  try {
    showLoader();

    // 1️⃣ Clear cart
    await fetch("/cart/clear.js", { method: "POST" });

    // 2️⃣ Add items back
    for (const item of items) {
      const variantId =
        item.variant_id ||
        (typeof item.variantId === "string"
          ? item.variantId.split("/").pop()
          : null);

      if (!variantId || !item.quantity) {
        console.warn("⚠️ Skipping invalid item:", item);
        continue;
      }

      await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: variantId,
          quantity: item.quantity,
        }),
      });
    }

    hideLoader();

    createStatusToast(
      "Items added to cart successfully",
      "success"
    );

    setTimeout(() => {
      window.location.href = "/cart";
    }, 700);

  } catch (err) {
    hideLoader();
    console.error("❌ Reorder failed:", err);

    createStatusToast(
      "Reorder Failed",
      "Some items could not be added to cart",
      "error"
    );
  }
};



//revieww buttton
window.openReviewModal = function (encodedOrder) {
  try {
    const orderData = JSON.parse(decodeURIComponent(encodedOrder));
    alert(`Opening review form for order #${orderData.orderNumber}`);
  } catch (e) {
    alert("Opening review form");
    console.error("Review parse error:", e);
  }
};

///////////////////////////////// exchange button code starts ////////////////////////////////////////////
/* =======================
   EXCHANGE STEPS UI
======================= */
function renderSteps(step) {
  const isActive = (n) => step >= n;

  return `
    <div style="width:100%;display:flex;justify-content:center;">
      <div style="width:360px;display:flex;justify-content:space-between;">
        ${["Select", "Details", "Confirm"].map((label, i) => {
          const n = i + 1;
          return `
            <div style="text-align:center;">
              <div style="
                width:28px;
                height:28px;
                border-radius:50%;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:13px;
                font-weight:500;
                background:${isActive(n) ? "#000" : "#e5e7eb"};
                color:${isActive(n) ? "#fff" : "#6b7280"};
                margin:0 auto;
              ">${n}</div>
              <div style="font-size:11px;color:#6b7280;margin-top:6px;">
                ${label}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

/* =======================
   OPEN EXCHANGE MODAL
======================= */
window.openExchangeModal = function (encodedOrder) {
  const orderData = JSON.parse(decodeURIComponent(encodedOrder));
  closeExchangeModal();

  const selectedItems = {}; // { idx: reason }

  document.body.insertAdjacentHTML("beforeend", `
    <div id="exchange-overlay"
      style="position:fixed;inset:0;background:rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center;z-index:9999;">

      <div style="background:#fff;width:420px;max-height:90vh;
        border-radius:12px;display:flex;flex-direction:column;overflow:hidden;">

        <!-- HEADER -->
        <div style="padding:16px;border-bottom:1px solid #e5e7eb;
          display:flex;justify-content:space-between;">
          <div>
            <div style="font-size:18px;font-weight:600;">Exchange Items</div>
            <div style="font-size:13px;color:#6b7280;">
              Order #${String(orderData.orderNumber).replace(/^#/, "")}
            </div>
          </div>
          <button onclick="closeExchangeModal()"
            style="border:none;background:none;font-size:18px;">×</button>
        </div>

        <!-- STEPS -->
        <div id="exchange-steps"
          style="padding:12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
          ${renderSteps(1)}
        </div>

        <!-- ITEMS -->
        <div style="padding:16px;overflow-y:auto;">
          <div style="font-size:15px;font-weight:500;margin-bottom:12px;">
            Select Items to Exchange
          </div>

          ${orderData.items.map((item, idx) => `
            <div style="border:1px solid #e5e7eb;border-radius:8px;
              padding:12px;margin-bottom:12px;">
              
              <div style="display:flex;gap:12px;">
                <input type="checkbox" data-idx="${idx}">
                <img src="${item.image}"
                  style="width:56px;height:56px;border-radius:6px;">
                <div>
                  <div style="font-size:14px;font-weight:500;">${item.title}</div>
                  <div style="font-size:12px;color:#6b7280;">Qty: ${item.quantity}</div>
                  <div style="font-size:14px;font-weight:500;">${item.price}</div>
                </div>
              </div>

              <!-- REASON -->
              <div class="exchange-reason" data-reason="${idx}"
                style="display:none;margin-top:10px;">
                <label style="font-size:12px;font-weight:500;">
                  Reason for Exchange *
                </label>
                <select style="width:100%;margin-top:6px;padding:8px;
                  border-radius:6px;border:1px solid #e5e7eb;">
                  <option value="">Select a reason</option>
                  <option>Wrong size</option>
                  <option>Wrong color / shade</option>
                  <option>Different style preference</option>
                  <option>Defective product</option>
                  <option>Quality issues</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          `).join("")}
        </div>

        <!-- FOOTER -->
        <div style="padding:16px;border-top:1px solid #e5e7eb;
          display:flex;justify-content:space-between;background:#f9fafb;">
          <button onclick="closeExchangeModal()" style="border:none;background:none;">
            Cancel
          </button>
          <button id="exchange-submit-btn" disabled
            style="background:#000;color:#fff;border:none;
              padding:8px 16px;border-radius:8px;opacity:.5;">
            Submit Exchange
          </button>
        </div>
      </div>
    </div>
  `);

  /* ===== STATE UPDATE ===== */
  function updateSubmitState() {
    const btn = document.getElementById("exchange-submit-btn");
    const valid =
      Object.keys(selectedItems).length &&
      Object.values(selectedItems).some(v => v);

    btn.disabled = !valid;
    btn.style.opacity = valid ? "1" : ".5";
    document.getElementById("exchange-steps").innerHTML =
      renderSteps(valid ? 2 : 1);
  }

  /* ===== CHECKBOX ===== */
  document.querySelectorAll('#exchange-overlay input[type="checkbox"]')
    .forEach(cb => {
      cb.addEventListener("change", e => {
        const idx = e.target.dataset.idx;
        const box = document.querySelector(`[data-reason="${idx}"]`);

        if (e.target.checked) {
          selectedItems[idx] = "";
          box.style.display = "block";
        } else {
          delete selectedItems[idx];
          box.style.display = "none";
        }
        updateSubmitState();
      });
    });

  /* ===== REASON ===== */
  document.querySelectorAll('#exchange-overlay select')
    .forEach(sel => {
      sel.addEventListener("change", e => {
        const idx = e.target.closest(".exchange-reason").dataset.reason;
        selectedItems[idx] = e.target.value;
        updateSubmitState();
      });
    });

  /* ===== SUBMIT ===== */
  document.getElementById("exchange-submit-btn")
    .addEventListener("click", () => {
      document.getElementById("exchange-steps").innerHTML = renderSteps(3);

      const formData = new FormData();
      formData.append("shop", Shopify.shop);
      formData.append("order_id", orderData.orderId);
      formData.append("customer_id", customerId);

      // line item ids, NOT variant ids
      formData.append(
        "product_ids",
        JSON.stringify(
          Object.keys(selectedItems).map(idx => orderData.items[idx].id)
        )
      );

      // description payload
      formData.append(
        "description",
        JSON.stringify({
          reason: "Exchange requested",
          requestedExchanges: Object.keys(selectedItems).map(idx => ({
            lineItemId: orderData.items[idx].id,
            variantId: orderData.items[idx].variant_id,
            reason: selectedItems[idx]
          }))
        })
      );

      fetch("https://omc.axentraos.co.in/utility/exchange_request_handler/", {
        method: "POST",
        body: formData
      })
      .then(res => {
        if (!res.ok) throw new Error("Exchange API failed");
        return res.json();
      })
      .then(() => {
        alert("Exchange request submitted successfully");
        closeExchangeModal();
      })
      .catch(err => {
        console.error(err);
        alert("Exchange failed");
      });

    });
};

/* =======================
   CLOSE MODAL
======================= */
window.closeExchangeModal = function () {
  document.getElementById("exchange-overlay")?.remove();
};


////////////////////////////// exchange button code ends///////////////////////////////////////////

  const createOrderCardHTML = (orderData) => {
    const encodedItem = encodeURIComponent(JSON.stringify(orderData));
    const orderNumber = String(orderData.orderNumber).replace(/^#/, "");
  
    return `
      <div style="
        background:#f9fafb;
        border:1px solid #e5e7eb;
        border-radius:4px;
        padding:16px;
        display:flex;
        flex-direction:column;
        gap:12px;
      ">
  
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">
  
          <div style="text-align:left; line-height:1.32;">
            <p style="margin:0;font-size:14px;font-weight:500;color:#111827;">
              Order #${orderNumber}
            </p>
            <p style="margin:0;font-size:12px;color:#6b7280;">
              Placed on ${orderData.orderDate}
            </p>
            <p style="margin-top:5px;margin-bottom:0;font-size:14px;font-weight:500;color:#111827;">
              ${orderData.totalPrice}
            </p>
          </div>
  
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="
              background:#e6f4ea;
              color:#15803d;
              font-size:12px;
              font-weight:500;
              padding:4px 10px;
              border-radius:999px;
              white-space:nowrap;
            ">
              ${orderData.fulfillmentStatus}
            </span>
  
            <button
              onclick="openOrderDetailsModal('${encodedItem}')"
              style="
                border:none;
                background:none;
                font-size:12px;
                font-weight:500;
                text-transform:uppercase;
                letter-spacing:0.05em;
                text-decoration:underline;
                cursor:pointer;
                display:flex;
                align-items:center;
                gap:4px;
              "
            >
              ORDER DETAILS
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>
          </div>
        </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${actionBtn("View", eyeIcon, encodedItem, "view")}
            ${actionBtn("Reorder", reorderIcon, encodedItem, "reorder")}
            ${actionBtn("Return", returnIcon, encodedItem, "return")}
            ${actionBtn("Exchange", exchangeIcon, encodedItem, "exchange")}
            ${actionBtn("Replace", exchangeIcon, encodedItem, "replace")}
            ${actionBtn("Subscribe", reorderIcon, encodedItem, "subscribe")}
          </div>

       
      </div>
    `;
  };


  function actionBtn(label, icon, encodedItem, action) {
  return `
    <button
      type="button"
      class="order-action-btn"
      data-action="${action}"
      data-item="${encodedItem}"
      style="
        display:inline-flex;
        align-items:center;
        gap:6px;
        padding:6px 10px;
        border:1px solid #e5e7eb;
        background:#fff;
        border-radius:6px;
        cursor:pointer;
        font-size:12px;
      "
    >
      ${icon}
      ${label}
    </button>
  `;
}

function decodeItem(encodedItem) {
  try {
    // ✅ Your actual case (from screenshot)
    return JSON.parse(decodeURIComponent(encodedItem));
  } catch (e1) {
    try {
      // fallback: Base64
      return JSON.parse(atob(encodedItem));
    } catch (e2) {
      try {
        // fallback: plain JSON
        return JSON.parse(encodedItem);
      } catch (e3) {
        console.error("❌ Unable to decode item:", encodedItem);
        return null;
      }
    }
  }
}



  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".order-action-btn");
    if (!btn) return;
  
    const action = btn.dataset.action;
    const encodedItem = btn.dataset.item;
  
    switch (action) {
      case "view":
        openOrderDetailsModal(encodedItem);
        break;
  
      case "reorder":
        openReorderModal(encodedItem);
        break;
  
      case "return":
        openReturnModal(encodedItem);
        break;
  
      case "replace":
        openReplacementModal(encodedItem);
        break;

      case "exchange":
        openExchangeModal(encodedItem);
        break;

        case "subscribe":
          console.log("RAW encodedItem:", encodedItem);
          handleSubscribe(encodedItem);
      break;
        
    }
  });
  
  

/////////////////////////////////// subscribe button starts ///////////////////////////////////

function createSubscriptionModal(orderData) {
  /* ---------------- helpers ---------------- */
  const escapeHtml = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  /* ---------------- items ---------------- */
  const itemsHTML = (orderData.items || []).map(item => {
    const variantId = item.variantId || item.variant_id || item.id || "";
    return `
      <div class="sub-item-row" data-id="${escapeHtml(variantId)}"
        style="display:flex;align-items:center;gap:12px;
               padding:12px;border:1px solid #e5e7eb;
               border-radius:8px;background:#fff;">
        
        <input type="checkbox" class="sub-item-checkbox" data-id="${escapeHtml(variantId)}">

        <img src="${escapeHtml(item.image || "")}"
          style="width:48px;height:48px;border-radius:6px;object-fit:cover;">

        <div style="flex:1;">
          <div style="font-weight:600;font-size:13px;">
            ${escapeHtml(item.title || item.name)}
          </div>
          <div style="font-size:11px;color:#6b7280;">Qty</div>
        </div>

        <button class="qty-btn" data-vid="${escapeHtml(variantId)}" data-dir="-1">−</button>
        <input id="qty-${escapeHtml(variantId)}"
          class="quantity-input"
          type="number" min="1"
          value="${escapeHtml(item.quantity || 1)}">
        <button class="qty-btn" data-vid="${escapeHtml(variantId)}" data-dir="1">+</button>
      </div>
    `;
  }).join("");

  /* ---------------- root ---------------- */
  const root = document.createElement("div");
  root.id = "subscription-modal-root";
  root.style.cssText = `
    background:#fff;
    border-radius:12px;
    max-width:620px;
    width:100%;
    max-height:90vh;
    overflow:auto;
    box-shadow:0 8px 30px rgba(0,0,0,.25);
    font-family:system-ui, -apple-system, sans-serif;
  `;

  root.innerHTML = `
    <!-- HEADER -->
    <div style="padding:16px;border-bottom:1px solid #e5e7eb;
                display:flex;justify-content:space-between;align-items:center;">
      <strong style="font-size:14px;">
        Subscribe to Order ${escapeHtml(orderData.orderNumber || orderData.name || "")}
      </strong>
      <button id="subscription-modal-close"
        style="border:none;background:none;font-size:18px;cursor:pointer;">✕</button>
    </div>

    <!-- BODY -->
    <div id="subscription-modal-body"
      style="padding:16px;display:flex;flex-direction:column;gap:18px;font-size:13px;">

      <!-- Plan Name -->
      <div>
        <label style="font-weight:600;">Plan Name</label>
        <input id="input-plan-name" type="text"
          style="width:100%;height:38px;border:1px solid #d1d5db;border-radius:6px;padding:0 10px;">
      </div>

      <!-- Description -->
      <div>
        <label style="font-weight:600;">Description</label>
        <input id="input-description" type="text"
          style="width:100%;height:38px;border:1px solid #d1d5db;border-radius:6px;padding:0 10px;">
      </div>

      <!-- Subscribe Type -->
      <div>
        <label style="font-weight:600;">Subscribe to</label>

        <div class="sub-box active" data-type="specific"
          style="margin-top:8px;padding:12px;border-radius:10px;
                 border:2px solid #0d9488;background:#ecfdf5;
                 display:flex;gap:10px;cursor:pointer;">
          <input type="radio" id="sub-specific" name="sub-type" checked>
          <div>
            <div style="font-weight:600;">Specific Items Only</div>
            <div style="font-size:12px;color:#6b7280;">
              Choose which items to include
            </div>
          </div>
        </div>

        <div class="sub-box" data-type="entire"
          style="margin-top:8px;padding:12px;border-radius:10px;
                 border:1px solid #d1d5db;
                 display:flex;gap:10px;cursor:pointer;">
          <input type="radio" id="sub-entire" name="sub-type">
          <div>
            <div style="font-weight:600;">Entire Order</div>
            <div style="font-size:12px;color:#6b7280;">
              Subscribe to all items
            </div>
          </div>
        </div>
      </div>

      <!-- ITEMS -->
      <div id="specific-items-section" style="display:flex;flex-direction:column;gap:12px;">
        <label style="font-weight:600;">Select Items</label>
        ${itemsHTML}
      </div>

      <!-- FREQUENCY -->
      <div style="display:flex;gap:12px;">
        <div style="flex:1;">
          <label style="font-weight:600;">Deliver every</label>
          <input id="input-delivery-number" type="number" value="1"
            style="width:100%;height:38px;border:1px solid #d1d5db;border-radius:6px;padding:0 10px;">
        </div>

        <div style="flex:1;">
          <label style="font-weight:600;">Time Unit</label>
          <select id="input-delivery-unit"
            style="width:100%;height:38px;border:1px solid #d1d5db;border-radius:6px;">
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month" selected>Month</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      <!-- MAX BILLING -->
      <div>
        <label style="font-weight:600;">Max Billing Cycle</label>
        <input id="input-max-billing-cycle" type="number"
          style="width:100%;height:38px;border:1px solid #d1d5db;border-radius:6px;padding:0 10px;">
      </div>

      <!-- BILLING TYPE -->
      <div>
        <label style="font-weight:600;">Billing Type</label>
        <select id="billing-type"
          style="width:100%;height:38px;border:1px solid #d1d5db;border-radius:6px;">
          <option value="Prepaid">Prepaid</option>
          <option value="Postpaid">Postpaid</option>
        </select>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="padding:16px;border-top:1px solid #e5e7eb;
                display:flex;justify-content:flex-end;gap:12px;">
      <button id="subscription-modal-cancel"
        type="button"
        style="height:36px;padding:0 14px;border:1px solid #d1d5db;border-radius:6px;">
        Cancel
      </button>
      <button id="subscription-modal-create"
        type="button"
        style="height:36px;padding:0 16px;border-radius:6px;
               background:#0d9488;color:white;border:none;">
        Create Subscription
      </button>
    </div>
  `;

  /* ---------- UI INTERACTIONS ---------- */
  const specificBox = root.querySelector('[data-type="specific"]');
  const entireBox = root.querySelector('[data-type="entire"]');
  const section = root.querySelector("#specific-items-section");

  function setType(type) {
    if (type === "entire") {
      entireBox.style.border = "2px solid #0d9488";
      entireBox.style.background = "#ecfdf5";
      specificBox.style.border = "1px solid #d1d5db";
      specificBox.style.background = "#fff";
      section.style.opacity = "0.5";
      section.style.pointerEvents = "none";
      root.querySelector("#sub-entire").checked = true;
    } else {
      specificBox.style.border = "2px solid #0d9488";
      specificBox.style.background = "#ecfdf5";
      entireBox.style.border = "1px solid #d1d5db";
      entireBox.style.background = "#fff";
      section.style.opacity = "1";
      section.style.pointerEvents = "auto";
      root.querySelector("#sub-specific").checked = true;
    }
  }

  specificBox.onclick = () => setType("specific");
  entireBox.onclick = () => setType("entire");

  root.querySelector("#subscription-modal-close").onclick = closeSubModal;
  root.querySelector("#subscription-modal-cancel").onclick = closeSubModal;

  root.querySelectorAll(".qty-btn").forEach(btn => {
    btn.onclick = () =>
      changeQty(btn.dataset.vid, Number(btn.dataset.dir));
  });

  /* ---------- CREATE SUBSCRIPTION (STEP 1) ---------- */
root.addEventListener("click", async (e) => {
  const btn = e.target.closest("#subscription-modal-create");
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  console.log("✅ Create Subscription clicked");

  try {
    const payload = buildStep1Payload(orderData, root);
    console.log("🟡 STEP-1 PAYLOAD", payload);

    const res = await fetch(
      "https://api.subscriptions.axentraos.co.in/api/v1/plans/customer_subscription/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const result = await res.json();
    console.log("🟢 STEP-1 API RESPONSE", result);

    if (!res.ok) {
      alert(result.message || "Failed to create subscription");
      return;
    }

    // 🔥 move to step-2 later
    // extract plan id safely
    const planId = result.data.id || result.data.plan_id;

    // prepare address defaults (example – adjust if already built)
    const addressDefaults = {
      shipping: orderData.shippingAddress || orderData.shipping_address
    };

    // call REAL step-2
    showStep2(
      planId,              // ✅ required
      payload,             // step-1 payload
      addressDefaults,     // shipping defaults
      orderData,           // original order data
      root,                // modal root
      customerId,// customer id
      payload.delivery_freq_conf // delivery config
    );



  } catch (err) {
    console.error("❌ STEP-1 ERROR", err);
    alert("Network error");
  }
});


  return root;
}

  

/**
 * Entry handler called from global click listener
 */
function handleSubscribe(encodedItem) {
  console.log("📩 Subscribe clicked");

  const orderData = decodeItem(encodedItem);
  if (!orderData) {
    alert("Invalid order data");
    return;
  }

  openSubscriptionModal(orderData);
}


/**
 * Opens overlay + mounts subscription modal
 * EXACT behavior as discussed
 */
function openSubscriptionModal(orderData) {
  // prevent duplicate modal
  if (document.getElementById("subscription-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "subscription-overlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,0.55)";
  overlay.style.zIndex = "1000";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.padding = "16px";

  const modal = createSubscriptionModal(orderData);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSubModal();
  });
}

/**
 * Close & cleanup modal + overlay
 */
function closeSubModal() {
  const overlay = document.getElementById("subscription-overlay");
  if (overlay) overlay.remove();
  document.body.style.overflow = "";
}


function buildStep1Payload(orderData, root) {
  /* =============================
     1️⃣ PRODUCT SELECTION
  ============================== */

  const entireSelected = root.querySelector("#sub-entire")?.checked;
  const product_variant_ids = {};

  if (entireSelected) {
    root.querySelectorAll(".sub-item-row").forEach(row => {
      const vid = row.dataset.id;
      const qty =
        Number(row.querySelector(".quantity-input")?.value || 1);

      if (vid) {
        product_variant_ids[vid] = qty;
      }
    });
  } else {
    root.querySelectorAll(".sub-item-checkbox:checked").forEach(cb => {
      const row = cb.closest(".sub-item-row");
      const vid = cb.dataset.id;
      const qty =
        Number(row.querySelector(".quantity-input")?.value || 1);

      if (vid) {
        product_variant_ids[vid] = qty;
      }
    });
  }

  // 🚨 HARD STOP — backend requires this
  if (!Object.keys(product_variant_ids).length) {
    throw new Error("No products selected for subscription");
  }

  /* =============================
     2️⃣ PRODUCT DESCRIPTION
     (ONLY SELECTED ITEMS)
  ============================== */

  const product_description = [];

  Object.entries(product_variant_ids).forEach(([vid, qty]) => {
    const item = (orderData.items || []).find(i =>
      String(i.variantId || i.variant_id || i.id) === String(vid)
    );

    if (!item) return;

    product_description.push({
      variant_id: vid,
      name: item.title || item.name || "",
      image: item.image || "",
      quantity: qty
    });
  });

  /* =============================
     3️⃣ DELIVERY FREQUENCY
  ============================== */

  const delivery_frequency = Number(
    root.querySelector("#input-delivery-number")?.value || 1
  );

  const delivery_unit =
    root.querySelector("#input-delivery-unit")?.value || "month";

  /* =============================
     4️⃣ CUSTOMER INFO
     (customerId IS GLOBAL)
  ============================== */

  const customer = orderData.customerDetails || {};
  let phone_code = "";
  let phone_number = customer.phone || "";

  if (phone_number.startsWith("+")) {
    phone_code = phone_number.slice(0, 3);
    phone_number = phone_number.slice(3);
  }

  /* =============================
     5️⃣ FINAL PAYLOAD
     (MATCHES API EXACTLY)
  ============================== */

  return {
    shop_url: Shopify.shop,
    platform: "Razorpay",
    created_by: "customer",

    customer_id: customerId, // ✅ global, as you confirmed
    email: customer.email || "",
    customer_name: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
    phone_code,
    phone_number,

    order_id: orderData.orderId || orderData.id,

    plan_name:
      root.querySelector("#input-plan-name")?.value.trim(),

    description:
      root.querySelector("#input-description")?.value.trim(),

    billing_type:
      root.querySelector("#billing-type")?.value || "Prepaid",

    max_billing_cycle:
      Number(
        root.querySelector("#input-max-billing-cycle")?.value || 0
      ) || null,

    product_variant_ids,
    product_description,

    delivery_freq_conf: [
      {
        delivery_frequency,
        delivery_unit,
        discount_type: "none",
        discount_value: 0
      }
    ]
  };
}

/**
 * Handles switching between "entire order" and "specific items"
 */
function handleSubscriptionTypeChange(type, root) {
  const ent = root.querySelector("#sub-entire");
  const spec = root.querySelector("#sub-specific");
  const section = root.querySelector("#specific-items-section");

  if (type === "entire") {
    ent.checked = true;
    spec.checked = false;
    section.style.display = "none";

    root.querySelectorAll(".sub-item-checkbox").forEach(cb => {
      cb.checked = false;
    });
  } else {
    ent.checked = false;
    spec.checked = true;
    section.style.display = "flex";
  }
}


/* ============================
   SCOPED HELPERS (YOUR MODAL)
============================ */

function selectAllItems(root = document) {
  root.querySelectorAll(".sub-item-checkbox").forEach(cb => {
    cb.checked = true;
  });
}

function clearAllItems(root = document) {
  root.querySelectorAll(".sub-item-checkbox").forEach(cb => {
    cb.checked = false;
  });
}

function toggleItemSectionVisibility(show, root = document) {
  const section = root.querySelector("#specific-items-section");
  if (!section) return;
  section.style.display = show ? "flex" : "none";
}

function disableQuantityInputs(disable, root = document) {
  root.querySelectorAll(".quantity-input").forEach(inp => {
    inp.disabled = disable;
  });
  root.querySelectorAll(".qty-btn").forEach(btn => {
    btn.disabled = disable;
  });
}

/* ============================
   QUANTITY HANDLER
============================ */

function changeQty(itemId, delta) {
  const input = document.getElementById(`qty-${itemId}`);
  if (!input) return;

  let val = parseInt(input.value || "1", 10);
  val += delta;
  if (val < 1) val = 1;

  input.value = val;
}


/* ============================
   STEP-1 RADIO TOGGLE LOGIC
============================ */

function wireSubscriptionStep1(root) {
  const entireRadio = root.querySelector("#sub-entire");
  const specificRadio = root.querySelector("#sub-specific");

  if (!entireRadio || !specificRadio) return;

  const applyState = () => {
    const isSpecific = specificRadio.checked;

    toggleItemSectionVisibility(isSpecific, root);
    disableQuantityInputs(!isSpecific, root);

    if (!isSpecific) {
      selectAllItems(root);
    }
  };

  entireRadio.addEventListener("change", applyState);
  specificRadio.addEventListener("change", applyState);

  // initial state
  applyState();
}

/* ============================
   STEP-2 UI (ADDRESS + PAY)
============================ */

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showStep2(
  planId,
  payload,
  addressDefaults,
  originalOrderData,
  root,
  customerId,
  deliveryConf
) {
  const body = root.querySelector("#subscription-modal-body");
  if (!body) return;

  const planName = payload.plan_name || "";

  // ✅ SAFETY: fallback billing = shipping if missing
  const shipping = addressDefaults?.shipping || {};
  const billing = addressDefaults?.billing || shipping;

  body.innerHTML = `
  <div style="display:flex;flex-direction:column;gap:18px;padding-bottom:20px;font-family:inherit;">

    <!-- HEADER -->
    <div>
      <div style="font-size:16px;font-weight:600;">Plan created successfully</div>
      <div style="margin-top:4px;font-size:13px;color:#6b7280;">
        Plan ID: ${escapeHtml(planId)}<br>
        Plan Name: ${escapeHtml(planName)}
      </div>
    </div>

    <!-- SHIPPING ADDRESS -->
    <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
      <label style="font-weight:600;font-size:15px;">Delivery Address</label>
      <button id="edit-shipping"
        style="padding:6px 12px;border:1px solid #d1d5db;border-radius:8px;background:#fff;cursor:pointer;">
        Edit
      </button>
    </div>

    <div id="shipping-display"
      style="padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">
      <div style="font-weight:600;">${escapeHtml(shipping.first_name)} ${escapeHtml(shipping.last_name)}</div>
      <div>${escapeHtml(shipping.address1)}</div>
      <div>${escapeHtml(shipping.address2 || "")}</div>
      <div>${escapeHtml(shipping.city)}, ${escapeHtml(shipping.province)} ${escapeHtml(shipping.zip)}</div>
      <div>${escapeHtml(shipping.country)}</div>
      <div style="margin-top:6px;color:#6b7280;">${escapeHtml(shipping.phone)}</div>
    </div>

    <div id="shipping-edit"
      class="grid"
      style="display:none;grid-template-columns:1fr 1fr;gap:12px;">
      <input id="addr-first-name" class="addr-input" value="${escapeHtml(shipping.first_name)}">
      <input id="addr-last-name" class="addr-input" value="${escapeHtml(shipping.last_name)}">
      <input id="addr-address1" class="addr-input" style="grid-column:span 2" value="${escapeHtml(shipping.address1)}">
      <input id="addr-address2" class="addr-input" style="grid-column:span 2" value="${escapeHtml(shipping.address2 || "")}">
      <input id="addr-city" class="addr-input" value="${escapeHtml(shipping.city)}">
      <input id="addr-province" class="addr-input" value="${escapeHtml(shipping.province)}">
      <input id="addr-zip" class="addr-input" value="${escapeHtml(shipping.zip)}">
      <input id="addr-country" class="addr-input" value="${escapeHtml(shipping.country)}">
      <input id="addr-phone" class="addr-input" style="grid-column:span 2" value="${escapeHtml(shipping.phone)}">
    </div>

    <!-- BILLING ADDRESS -->
    <div style="margin-top:24px;display:flex;justify-content:space-between;align-items:center;">
      <label style="font-weight:600;font-size:15px;">Billing Address</label>
      <button id="edit-billing"
        style="padding:6px 12px;border:1px solid #d1d5db;border-radius:8px;background:#fff;cursor:pointer;">
        Edit
      </button>
    </div>

    <div id="billing-display"
      style="padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">
      <div style="font-weight:600;">${escapeHtml(billing.first_name)} ${escapeHtml(billing.last_name)}</div>
      <div>${escapeHtml(billing.address1)}</div>
      <div>${escapeHtml(billing.address2 || "")}</div>
      <div>${escapeHtml(billing.city)}, ${escapeHtml(billing.province)} ${escapeHtml(billing.zip)}</div>
      <div>${escapeHtml(billing.country)}</div>
      <div style="margin-top:6px;color:#6b7280;">${escapeHtml(billing.phone)}</div>
    </div>

    <div id="billing-edit"
      class="grid"
      style="display:none;grid-template-columns:1fr 1fr;gap:12px;">
      <input id="bill-first-name" class="addr-input" value="${escapeHtml(billing.first_name)}">
      <input id="bill-last-name" class="addr-input" value="${escapeHtml(billing.last_name)}">
      <input id="bill-address1" class="addr-input" style="grid-column:span 2" value="${escapeHtml(billing.address1)}">
      <input id="bill-address2" class="addr-input" style="grid-column:span 2" value="${escapeHtml(billing.address2 || "")}">
      <input id="bill-city" class="addr-input" value="${escapeHtml(billing.city)}">
      <input id="bill-province" class="addr-input" value="${escapeHtml(billing.province)}">
      <input id="bill-zip" class="addr-input" value="${escapeHtml(billing.zip)}">
      <input id="bill-country" class="addr-input" value="${escapeHtml(billing.country)}">
      <input id="bill-phone" class="addr-input" style="grid-column:span 2" value="${escapeHtml(billing.phone)}">
    </div>

  </div>
`;
root.querySelectorAll(".addr-input").forEach(inp => {
  inp.style.height = "42px";
  inp.style.border = "1px solid #d1d5db";
  inp.style.borderRadius = "8px";
  inp.style.padding = "6px 10px";
  inp.style.fontSize = "14px";
});

  /* TOGGLE SHIPPING */
  const shipEditBtn = root.querySelector("#edit-shipping");
  const shipDisp = root.querySelector("#shipping-display");
  const shipEdit = root.querySelector("#shipping-edit");

  shipEditBtn.onclick = () => {
    const editing = shipEdit.style.display === "none";
    shipDisp.style.display = editing ? "none" : "block";
    shipEdit.style.display = editing ? "grid" : "none";
    shipEditBtn.textContent = editing ? "Save" : "Edit";
  };

  /* TOGGLE BILLING */
  const billEditBtn = root.querySelector("#edit-billing");
  const billDisp = root.querySelector("#billing-display");
  const billEdit = root.querySelector("#billing-edit");

  billEditBtn.onclick = () => {
    const editing = billEdit.style.display === "none";
    billDisp.style.display = editing ? "none" : "block";
    billEdit.style.display = editing ? "grid" : "none";
    billEditBtn.textContent = editing ? "Save" : "Edit";
  };

  /* FOOTER */
  const footer = root.querySelector("div[style*='justify-content:flex-end']");
  footer.innerHTML = `
    <button id="step2-close">Close</button>
    <button id="step2-submit">Subscribe Now</button>
  `;

  root.querySelector("#step2-close").onclick = closeSubModal;


  /* FINAL SUBMIT */
  root.querySelector("#step2-submit").onclick = async () => {

    const customer = originalOrderData.customerDetails || {};
    let phone_code = "";
    let phone_number = customer.phone || "";

    if (phone_number.startsWith("+")) {
      phone_code = phone_number.slice(0, 3);
      phone_number = phone_number.slice(3);
    }

    const shipping = {
      first_name: root.querySelector("#addr-first-name").value,
      last_name: root.querySelector("#addr-last-name").value,
      address1: root.querySelector("#addr-address1").value,
      address2: root.querySelector("#addr-address2").value,
      city: root.querySelector("#addr-city").value,
      province: root.querySelector("#addr-province").value,
      zip: root.querySelector("#addr-zip").value,
      country: root.querySelector("#addr-country").value,
      phone: root.querySelector("#addr-phone").value
    };

    const billing = {
      first_name: root.querySelector("#bill-first-name").value,
      last_name: root.querySelector("#bill-last-name").value,
      address1: root.querySelector("#bill-address1").value,
      address2: root.querySelector("#bill-address2").value,
      city: root.querySelector("#bill-city").value,
      province: root.querySelector("#bill-province").value,
      zip: root.querySelector("#bill-zip").value,
      country: root.querySelector("#bill-country").value,
      phone: root.querySelector("#bill-phone").value
    };


    const finalPayload = {
      plan_id: planId,
      shop_url: Shopify.shop,
      //platform: "Razorpay",          
      customer_id: customerId,
      email: originalOrderData.customerDetails?.email || "",
      customer_name: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
      phone_code,
      phone_number,
      //product_variant_ids: payload.product_variant_ids, // ✅ REQUIRED
      shipping_address: shipping,
      billing_address : billing,
      delivery_freq_conf: deliveryConf
    };
  
    console.log("🟣 STEP-3 PAYLOAD", finalPayload);
  
    const res = await fetch(
      "https://api.subscriptions.axentraos.co.in/api/v1/plans/subscription_purchase_view/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload)
      }
    );
  
    const result = await res.json();
  
    if (!res.ok) {
      body.innerHTML = `<p style="color:red">${result.message}</p>`;
      return;
    }
  
    const paymentUrl = result.payment_url || result.data?.payment_url;
  
    // ✅ REAL PAYMENT FLOW
    window.location.href = paymentUrl;
  };
  
}



/////////////////////////////////// subscribe button ends ///////////////////////////////////



//////////////////////////////// Replace button starts //////////////////////////////////

  window.openReplacementModal = function (encodedOrder) {
    const orderData = JSON.parse(decodeURIComponent(encodedOrder));
    currentExchangeOrderData = orderData;
  
    closeReplacementModal?.();
  
    document.body.insertAdjacentHTML("beforeend", `
      <div id="replacement-overlay"
        style="position:fixed;inset:0;background:rgba(0,0,0,.4);
        display:flex;align-items:center;justify-content:center;z-index:9999;">
  
        <div style="background:#fff;width:420px;max-height:90vh;
          border-radius:12px;display:flex;flex-direction:column;overflow:hidden;">
  
          <!-- HEADER -->
          <div style="padding:16px;border-bottom:1px solid #e5e7eb;
            display:flex;justify-content:space-between;">
            <div>
              <div style="font-size:18px;font-weight:600;">Replace Items</div>
              <div style="font-size:13px;color:#6b7280;">
                Order #${orderData.orderNumber}
              </div>
            </div>
            <button onclick="closeReplacementModal()" style="border:none;background:none;">×</button>
          </div>

           <!-- STEPS -->
          <div id="exchange-steps"
            style="padding:12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
            ${renderSteps(1)}
          </div>
  
          <!-- ITEMS -->
          <div id="replacement-items" style="padding:16px;overflow-y:auto;">
            ${renderReplacementItems(orderData)}
          </div>
  
          <!-- FOOTER -->
          <div style="padding:16px;border-top:1px solid #e5e7eb;
            display:flex;justify-content:space-between;background:#f9fafb;">
            <button onclick="closeReplacementModal()" style="border:none;background:none;">
              Cancel
            </button>
            <button id="replacement-submit-btn"
              style="background:#000;color:#fff;border:none;
              padding:8px 16px;border-radius:8px;opacity:.5;">
              Submit Replacement
            </button>
          </div>
        </div>
      </div>
    `);
    // 🔥 FORCE ATTACH SUBMIT HANDLER (THIS IS THE FIX)
    setTimeout(() => {
      const btn = document.getElementById("replacement-submit-btn");
      if (!btn) return;

      btn.addEventListener("click", submitReplacement);

      console.log("✅ Submit handler attached");
    }, 0);

  };

  function renderReplacementItems(orderData) {
    return orderData.items.map(item => {
      const itemId = Number(item.id);
      const isSelected = selectedReplacementItemIds.includes(itemId);
  
      return `
        <div onclick="toggleReplacementItem(${itemId})"
          style="border:2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'};
          border-radius:10px;padding:12px;margin-bottom:12px;cursor:pointer;">
  
          <div style="display:flex;gap:12px;align-items:flex-start;">
  
            <div style="width:18px;height:18px;border-radius:4px;
              border:2px solid ${isSelected ? '#3b82f6' : '#9ca3af'};
              background:${isSelected ? '#3b82f6' : '#fff'};
              color:#fff;display:flex;align-items:center;
              justify-content:center;font-size:12px;">
              ${isSelected ? '✓' : ''}
            </div>
  
            <img src="${item.image}" style="width:56px;height:56px;border-radius:6px;">
            <div>
              <div style="font-size:14px;font-weight:500;">${item.title}</div>
              <div style="font-size:12px;color:#6b7280;">Qty: ${item.quantity}</div>
              <div style="font-size:13px;font-weight:500;">${item.price}</div>
            </div>
          </div>
  
          ${isSelected ? renderReason(itemId) : ''}
        </div>
      `;
    }).join("");
  }  

  function renderReason(itemId) {
    const reason = replacementDetails[itemId]?.reason || "";
  
    return `
      <div style="margin-top:10px;"
        onclick="event.stopPropagation()"> <!-- 🔥 THIS LINE -->
  
        <label style="font-size:12px;font-weight:500;">
          Reason for Replacement *
        </label>
  
        <select
          onchange="setReplacementReason(${itemId}, this.value)"
          style="width:100%;margin-top:6px;padding:8px;
          border-radius:6px;border:1px solid #e5e7eb;">
          <option value="">Select reason</option>
          <option ${reason==='Defective product'?'selected':''}>Defective product</option>
          <option ${reason==='Damaged on arrival'?'selected':''}>Damaged on arrival</option>
          <option ${reason==='Quality issue'?'selected':''}>Quality issue</option>
          <option ${reason==='Missing parts'?'selected':''}>Missing parts</option>
          <option ${reason==='Other'?'selected':''}>Other</option>
        </select>
      </div>
    `;
  }
  

  window.toggleReplacementItem = function (itemId) {
      itemId = Number(itemId); // 👈 ADD THIS LINE
    
    console.log("🟢 TOGGLE ITEM:", itemId);
  
    if (selectedReplacementItemIds.includes(itemId)) {
      selectedReplacementItemIds =
        selectedReplacementItemIds.filter(id => id !== itemId);
      delete replacementDetails[itemId];
    } else {
      selectedReplacementItemIds.push(itemId);
      replacementDetails[itemId] = {};
    }
  
    console.log("✅ selectedReplacementItemIds:", selectedReplacementItemIds);
    console.log("📦 replacementDetails:", replacementDetails);
  
    document.getElementById("replacement-items").innerHTML =
      renderReplacementItems(currentExchangeOrderData);
  
    validateReplacement();
  };

  window.setReplacementReason = function (itemId, reason) {
    replacementDetails[itemId] = { reason };
    console.log("✍️ Reason set:", itemId, reason);
    validateReplacement();
  };

  function validateReplacement() {
    const btn = document.getElementById("replacement-submit-btn");
  
    const valid =
      selectedReplacementItemIds.length > 0 &&
      selectedReplacementItemIds.every(
        id => replacementDetails[id]?.reason
      );
  
    console.log("🔎 VALIDATE:", valid);
  
    btn.disabled = !valid;          // ✅ THIS controls click
    btn.style.opacity = valid ? "1" : ".5";
    btn.style.pointerEvents = valid ? "auto" : "none"; // 🔥 IMPORTANT
  }
  

  window.submitReplacement = async function () {
    console.log("🚀 SUBMIT REPLACEMENT CLICKED");
  
    if (!selectedReplacementItemIds.length) {
      alert("Select at least one item");
      return;
    }
  
    // build payload
    const items = selectedReplacementItemIds.map(id => ({
      line_item_id: id,
      reason: replacementDetails[id]?.reason || ""
    }));
  
    console.log("📦 SUBMIT ITEMS:", items);
  
    const formData = new FormData();
    formData.append("shop", Shopify.shop);
    formData.append("order_id", currentExchangeOrderData.orderId);
    formData.append("customer_id", customerId);
    formData.append("product_ids", JSON.stringify(selectedReplacementItemIds));
    formData.append("description", JSON.stringify({
      replacement_items: items
    }));
  
    try {
      const res = await fetch(
        "https://omc.axentraos.co.in/utility/replacement_request_handler/",
        { method: "POST", body: formData }
      );
  
      if (!res.ok) throw new Error("Replacement failed");
  
      console.log("✅ REPLACEMENT SUCCESS");
  
      createStatusToast(
        "Replacement",
        "Replacement request submitted successfully",
        "success"
      );
  
      closeReplacementModal();
      setTimeout(() => window.location.reload(), 800);
  
    } catch (err) {
      console.error("❌ SUBMIT ERROR:", err);
      alert("Replacement request failed");
    }
  };

  
  window.closeReplacementModal = function () {
    document.getElementById("replacement-overlay")?.remove();
  };
  

  ////////////////////////////// Replace button ends ////////////////////////////////////

  ////////////////////////////// return button //////////////////////////////////////////  
  window.openReturnModal = function (encodedOrder) {
    const orderData = JSON.parse(decodeURIComponent(encodedOrder));
    window.closeReturnModal();
  
    const selectedItems = {}; // { idx: reason }
  
    function renderSteps(step) {
      const dot = (n) =>
        `background:${step >= n ? "#000" : "#e5e7eb"};
         color:${step >= n ? "#fff" : "#6b7280"};`;
    
      return `
        <div style="
          display:flex;
          width:100%;
          justify-content:space-between;
          margin:0 auto;
        ">
          ${["Select", "Details", "Confirm"].map((l, i) => `
            <div style="flex:1;text-align:center;">
              <div style="
                width:28px;
                height:28px;
                border-radius:50%;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:13px;
                margin:0 auto;
                ${dot(i + 1)}
              ">${i + 1}</div>
              <div style="font-size:11px;color:#6b7280;margin-top:4px;">
                ${l}
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }
  
    document.body.insertAdjacentHTML("beforeend", `
      <div id="return-overlay"
        style="position:fixed;inset:0;background:rgba(0,0,0,.4);
        display:flex;align-items:center;justify-content:center;z-index:9999;">
  
        <div style="background:#fff;width:420px;max-height:90vh;
          border-radius:12px;display:flex;flex-direction:column;overflow:hidden;">
  
          <div style="padding:16px;border-bottom:1px solid #e5e7eb;
            display:flex;justify-content:space-between;">
            <div>
              <div style="font-size:18px;font-weight:600;">Return Items</div>
              <div style="font-size:13px;color:#6b7280;">
                Order #${orderData.orderNumber}
              </div>
            </div>
            <button onclick="closeReturnModal()" style="border:none;background:none;font-size:18px;">×</button>
          </div>
  
          <div id="return-steps"
            style="padding:12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
            ${renderSteps(1)}
          </div>
  
          <div style="padding:16px;overflow-y:auto;">
            ${orderData.items.map((item, idx) => `
              <div style="border:1px solid #e5e7eb;border-radius:8px;
                padding:12px;margin-bottom:12px;">
                
                <div style="display:flex;gap:12px;">
                  <input type="checkbox" data-idx="${idx}">
                  <img src="${item.image}" style="width:56px;height:56px;border-radius:6px;">
                  <div>
                    <div>${item.title}</div>
                    <div>Qty: ${item.quantity}</div>
                    <div>${item.price}</div>
                  </div>
                </div>
  
                <div class="reason-box" data-reason="${idx}"
                  style="display:none;margin-top:10px;">
                  <select style="width:100%;padding:8px;">
                    <option value="">Select a reason</option>
                    <option>Wrong size</option>
                    <option>Defective product</option>
                    <option>Changed my mind</option>
                    <option>Quality issues</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            `).join("")}
          </div>
  
          <div style="padding:16px;border-top:1px solid #e5e7eb;
            display:flex;justify-content:flex-end;">
            <button id="return-submit-btn" disabled
              style="background:#000;color:#fff;padding:8px 16px;border-radius:8px;opacity:.5;">
              Submit Return
            </button>
          </div>
        </div>
      </div>
    `);
    wireReplacementCheckboxes(orderData);

    function wireReplacementCheckboxes(orderData) {
      selectedReplacementItemIds = []; // reset every time
      currentExchangeOrderData = orderData;
    
      document
        .querySelectorAll(".replacement-checkbox")
        .forEach(cb => {
          cb.addEventListener("change", (e) => {
            const itemId = e.target.dataset.itemId;
    
            if (!itemId) return;
    
            if (e.target.checked) {
              if (!selectedReplacementItemIds.includes(itemId)) {
                selectedReplacementItemIds.push(itemId);
              }
            } else {
              selectedReplacementItemIds =
                selectedReplacementItemIds.filter(id => id !== itemId);
            }
    
            console.log(
              "✅ Replacement items selected:",
              selectedReplacementItemIds
            );
          });
        });
    }
    
  
    const overlay = document.getElementById("return-overlay");
  
    function updateButton() {
      const btn = overlay.querySelector("#return-submit-btn");
      const valid = Object.values(selectedItems).some(Boolean);
      btn.disabled = !valid;
      btn.style.opacity = valid ? "1" : ".5";
      overlay.querySelector("#return-steps").innerHTML = renderSteps(valid ? 2 : 1);
    }
  
    overlay.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener("change", e => {
        const idx = e.target.dataset.idx;
        const box = overlay.querySelector(`[data-reason="${idx}"]`);
        if (e.target.checked) {
          selectedItems[idx] = "";
          box.style.display = "block";
        } else {
          delete selectedItems[idx];
          box.style.display = "none";
        }
        updateButton();
      });
    });
  
    overlay.querySelectorAll('.reason-box select').forEach(sel => {
      sel.addEventListener("change", e => {
        const idx = e.target.closest(".reason-box").dataset.reason;
        selectedItems[idx] = e.target.value;
        updateButton();
      });
    });
  
    // ✅ FINAL SUBMIT (LINE ITEM IDS)
    overlay.querySelector("#return-submit-btn").addEventListener("click", async () => {
      overlay.querySelector("#return-steps").innerHTML = renderSteps(3);
  
      // 🔥 THIS IS THE FIX
      const productIds = Object.keys(selectedItems)
        .map(idx => orderData.items[idx]?.id) // LINE ITEM ID
        .filter(Boolean);
  
      if (!productIds.length) {
        alert("Invalid product selection");
        return;
      }
  
      const formData = new FormData();
      formData.append("shop", Shopify.shop);
      formData.append("order_id", orderData.orderId);
      formData.append("customer_id", customerId);
      formData.append("product_ids", JSON.stringify(productIds));
      formData.append("description", JSON.stringify({
        reason: "Return request",
        items: selectedItems
      }));
  
      console.log("FINAL RETURN PAYLOAD", {
        order_id: orderData.orderId,
        product_ids: productIds
      });
  
      try {
        const res = await fetch(
          "https://omc.axentraos.co.in/utility/return_request_handler/",
          { method: "POST", body: formData }
        );
  
        if (!res.ok) throw new Error("API failed");
  
        alert("Return request submitted successfully");
        closeReturnModal();
      } catch (e) {
        console.error(e);
        alert("Return request failed");
      }
    });
  };
  
  window.closeReturnModal = function () {
    document.getElementById("return-overlay")?.remove();
  };
  
  
  
  window.closeReturnModal = function () {
    document.getElementById("return-overlay")?.remove();
  };
//////////////////////////////////////////// return buttton ends //////////////////////////////////////
  
// **********ORDERCARDHTML ENDS************************************************************

  // Function to render filtered orders
  let activeStatusFilter = "All Orders"; //c1
  const renderFilteredOrders = () => {
    filteredOrders = applyFilters();
    const ordersListContainer = document.getElementById("ordersListContainer");

    if (filteredOrders.length === 0) {
      const searchQuery = document
        .getElementById("orderSearch")
        .value.toLowerCase();
      ordersListContainer.innerHTML = createEmptyCard("orders", searchQuery);
    } else {
      ordersListContainer.innerHTML = filteredOrders
        .map(createOrderCardHTML)
        .join("");
    }

    // Update order count
    document.getElementById("orderCount").textContent = `${
      filteredOrders.length
    } ${filteredOrders.length === 1 ? "order" : "orders"} found`;
  };

  const ordersContent = `
    <div style="position: relative; height: 260px; margin-bottom: 32px; overflow: hidden; border-radius: 4px;">
    <img src="https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
        alt="Order History"
        style="width: 100%; height: 100%; object-fit: cover;">
    <div style="position: absolute; inset: 0; background: linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4)); display: flex; flex-direction: column; justify-content: center; padding: 0 32px; color: white;">
      <div style="font-size: 20px;">Order History</div>
      <div class="xircls-order-header-subtitle" style="font-size: 14px; max-width: 50%;">
        View and manage your Armani Beauty orders
      </div>
    </div>
  </div>

  <!-- 🔍 SEARCH + DATE ROW -->
  <div
  class="xircls-order-header"
  style="
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin: 24px 0;
  "
>
  <!-- LEFT SIDE -->
  <div style="display: flex; align-items: center; gap: 12px;">
    
    <!-- Download Invoices -->
    <div style="position: relative; display: inline-block;">
      <button
        onclick="this.nextElementSibling.style.display =
          this.nextElementSibling.style.display === 'block' ? 'none' : 'block'"
        style="
          height: 36px;
          padding: 0 44px 0 14px;
          border-radius: 4px;
          border: none;
          outline: none;
          background: #000;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
          position: relative;
        "
      >
        Download Invoices

        <!-- Chevron arrow (same as time filter) -->
        <span
          style="
            position: absolute;
            right: 14px;
            top: 50%;
            width: 8px;
            height: 8px;
            border-right: 1.5px solid #fff;
            border-bottom: 1.5px solid #fff;
            transform: translateY(-50%) rotate(45deg);
            pointer-events: none;
          "
        ></span>
      </button>

      <!-- Dropdown -->
      <div
        style="
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 6px;
          background: #fff;
          border-radius: 6px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          min-width: 220px;
          z-index: 1000;
          overflow: hidden;
        "
      >
        <div style="padding: 10px 14px; cursor: pointer; text-align: left;">Download All Invoices</div>
        <div style="padding: 10px 14px; cursor: pointer; text-align: left;">Download Business Invoices</div>
      </div>
    </div>


    <!-- Date Filter -->
    <div style="position: relative; display: inline-block;">
  <button
    onclick="this.nextElementSibling.style.display =
      this.nextElementSibling.style.display === 'block' ? 'none' : 'block'"
    style="
      height: 36px;
      padding: 0 44px 0 14px;
      border-radius: 4px;
      border: 1px solid black;
      outline: none;
      background: #f5f5f5;
      color: #111;
      font-size: 14px;
      cursor: pointer;
      position: relative;
    "
  >
    All Time

    <!-- Chevron arrow -->
    <span
      style="
        position: absolute;
        right: 14px;
        top: 50%;
        width: 8px;
        height: 8px;
        border-right: 1.5px solid #111;
        border-bottom: 1.5px solid #111;
        transform: translateY(-50%) rotate(45deg);
        pointer-events: none;
      "
    ></span>
  </button>

  <!-- Dropdown -->
  <div
    style="
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 6px;
      background: #fff;
      border-radius: 6px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      min-width: 200px;
      z-index: 1000;
      overflow: hidden;
    "
  >
    <div style="padding: 10px 14px; cursor: pointer; text-align: left;">
      All Time
    </div>
    <div style="padding: 10px 14px; cursor: pointer; text-align: left;">
      Last 30 days
    </div>
    <div style="padding: 10px 14px; cursor: pointer; text-align: left;">
      Last 6 Months
    </div>
    <div style="padding: 10px 14px; cursor: pointer; text-align: left;">
      Last 12 Months
    </div>
  </div>
</div>

  </div>

  <!-- RIGHT SIDE -->
  <div style="position: relative; width: 360px;">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      style="
        position: absolute;
        left: 12px;
        top: 12px;
        width: 16px;
        height: 16px;
        color: #6b7280;
      "
    >
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.3-4.3"></path>
    </svg>

    <input
  id="orderSearch"
  type="search"
  placeholder="Search by order number or product name"
  style="
    height: 40px;
    width: 100%;
    border-radius: 4px;
    border: 1px solid #e5e7eb;   /* light initially */
    outline: none;
    background-color: #ffffff;
    box-shadow: none;
    padding-left: 40px;
    padding-right: 12px;
    font-size: 14px;
    transition: border-color 0.2s ease;
  "
  onfocus="this.style.border='1px solid #111'"
  onblur="this.style.border='1px solid #e5e7eb'"
/>

  </div>
</div>


  

  <!-- ✅ TABS BELOW SEARCH -->
  <div id="orderStatusTabs" style="margin-bottom: 24px; text-align: left;"></div>

  <!-- ✅ ORDERS LIST -->
  <div id="ordersListContainer"
      style="display: flex; flex-direction: column; gap: 24px;">
    ${customerOrders.map(createOrderCardHTML).join("")}
  </div>

  `;
  //c4
  //below is c4
  function renderOrderStatusTabs() {
    const container = document.getElementById("orderStatusTabs");
    if (!container) return;
  
    container.innerHTML = `
      <div style="
        display:inline-flex;
        background:#f4f4f5;
        padding:6px;
        border-radius:6px;
        gap:4px;
      ">
        ${["All Orders","Processing","Shipped","In Transit","Delivered"]
          .map(
            status => `
            <button
              data-status="${status}"
              style="
                border:none;
                padding:6px 12px;
                border-radius:4px;
                cursor:pointer;
                font-size:14px;
                font-weight:500;
                background:${activeStatusFilter === status ? "#fff" : "transparent"};
                box-shadow:${activeStatusFilter === status ? "0 1px 2px rgba(0,0,0,0.08)" : "none"};
              "
            >
              ${status}
            </button>`
          )
          .join("")}
      </div>
    `;
  
    container.querySelectorAll("button").forEach(btn => {
      btn.onclick = () => {
        activeStatusFilter = btn.dataset.status;
        renderOrderStatusTabs();
        renderFilteredOrders(); // 🔥 your existing logic
      };
    });
  }
  

  ordersContainer.innerHTML = ordersContent;
  renderOrderStatusTabs();


  // Add event listeners for filtering
  document
    .getElementById("orderSearch")
    .addEventListener("input", renderFilteredOrders);
  document
    .getElementById("statusFilter")
    .addEventListener("change", renderFilteredOrders);
  document
    .getElementById("dateFilter")
    .addEventListener("change", renderFilteredOrders);

  // Add clear filters functionality
}

function openOrderDetailsModal(orderData) {
  orderData = JSON.parse(decodeURIComponent(orderData));
  // Create the modal element
  const modal = document.createElement("div");
  modal.id = "orderDetailsModal";
  modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000; /* Ensure it's on top of everything */
        text-align:left;
    `;

  // Create the modal content container
  const modalContent = document.createElement("div");
  modalContent.classList.add("order-details-modal-content");
  modalContent.style.cssText = `
        background-color: white;
        padding: 32px;
        border-radius: 8px;
        width: 70vw; /* Adjust as needed */
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        display: flex;
        flex-direction: column; /*For section stacking*/
        gap: 24px;/*Spacing between sections*/
        text-align: left; /*Left align all texts within the modal*/
        position: absolute;
        overflow-y: auto;
        height: 90%;
    `;

  // -- Now directly inside the function --
  const modalHeaderHTML = `
  <div id="xircls-order-details-close" style="position: absolute; top: 10px; right: 10px; cursor: pointer;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 16px; width: 16px;">
                            <path d="M18 6 6 18"></path>
                            <path d="m6 6 12 12"></path>
                          </svg></div>
        <div style="display: flex; flex-direction: column; text-align: center;">
            <div style="display: flex; align-items: center; text-align: left;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 20px; width: 20px; margin-right: 8px;">
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                    <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                    <path d="M10 9H8"></path>
                    <path d="M16 13H8"></path>
                    <path d="M16 17H8"></path>
                </svg>
                <div style="font-size: 18px; font-weight: 600;  ">Order ${orderData.orderNumber} Details</div>
            </div>
            <div style="font-size: 14px; color: #6b7280; text-align: left; margin-top: -4px;">Placed on ${orderData.orderDate}</div>
            
        </div>
    `;

  const orderDetailsHTML = `
     <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="order-modal-status" style="display: inline-flex; align-items: center; border-radius: 9999px; transition: background-color 0.2s, color 0.2s; padding: 2px 12px; font-size: 14px; font-weight: 500; color:black; border: 1px solid black;">
                        ${orderData.fulfillmentStatus}
         </div>
             <button class="modal-invoice-btn" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; height: 36px; border-radius: 4px; padding-left: 12px; padding-right: 12px; border: none; cursor: pointer;">
                   <svg class="dwnld-svg-modal" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 16px; width: 16px; margin-right: 4px;">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" x2="12" y1="15" y2="3"></line>
                    </svg>
             Download Invoice
               </button>
              </div>
                <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start; gap: 16px;">
        <div class="order-modal-tablist" role="tablist" aria-orientation="horizontal" style=" display: flex; width: 100%; border-radius: 4px; background-color: #f0f0f0; padding: 4px; justify-content: space-between; font-size: 14px; outline: none; text-align:center; align-items: center;">
    <div role="tab" aria-selected="true" aria-controls="radix-:rqa:-content-items" data-state="active" id="itemsTab" style="width:100%; cursor: pointer; text-align: center; padding: 4px;" onclick="showTabContent('items')">Items</div>
    <div role="tab" aria-selected="false" aria-controls="radix-:rqa:-content-shipping" data-state="inactive" id="shippingTab" style="width:100%; cursor: pointer; text-align: center; padding: 4px;" onclick="showTabContent('shipping')">Shipping Info</div>
    <div role="tab" aria-selected="false" aria-controls="radix-:rqa:-content-payment" data-state="inactive" id="paymentTab" style="width:100%; cursor: pointer; text-align: center; padding: 4px;" onclick="showTabContent('payment')">Payment Details</div>
</div>
          </div>
<div id="itemsContent" style="display: block;">
    <table class="modal-items-table" style="width: 100%; border-collapse: collapse; font-size: 14px; color: #6b7280;">
        <thead>
            <tr>
                <th style="text-align: left; padding: 8px;">Image</th>
                <th style="text-align: left; padding: 8px;">Product</th>
                <th style="text-align: left; padding: 8px;">Price</th>
                <th style="text-align: left; padding: 8px;">Quantity</th>
              
            </tr>
        </thead>
        <tbody>
            ${orderData.items
              .map(
                (item) => `
              <tr style="border-top: 1px solid  #e5e7eb;">
                <td style="padding: 8px; text-align: left;">
                    <div style="width: 80px; height: 80px; border-radius: 4px; overflow: hidden; background-color: #f0f0f0;">
                        <img src=${item.image}
                             alt="Luminous Silk Foundation"
                             style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                </td>
                <td style="padding: 8px; text-align: left;">
                    <div style="font-weight: 500;">${item.title}</div>
                </td>
                <td style="padding: 8px; text-align: left;">${item.price}</td>
                <td style="padding: 8px; text-align: left;">${item.quantity}</td>
                
            </tr>
              `
              )
              .join("")}
        </tbody>
    </table>
    <div style="border-radius: 8px; padding: 16px; margin-top: 24px; margin-bottom: 24px; border: 1px solid  #e5e7eb;">
    <div class="modal-order-summary-header" style="font-weight: 500; margin-bottom: 12px; font-size: 16px; color: black;">Order Summary</div>
    <div style="display: flex; flex-direction: column;">
        <div class="modal-order-summary" style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280;">
            <div>Subtotal</div>
            <div>${orderData.subtotalPrice}</div>
        </div>
        <div class="modal-order-summary" style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280;">
            <div>Discount</div>
            <div style="color: #ef4444;">-${orderData.total_discount}</div>
        </div>
     
        <div class="modal-order-summary" style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280;">
            <div>Tax</div>
            <div>${orderData.total_tax ? orderData.total_tax : "-"}</div>
        </div>
        <div style="border-top: 1px solid #e5e7eb; height: 1px; width: 100%; margin: 8px 0; display: block;"></div>
        <div class="modal-order-total" style="display: flex; justify-content: space-between; font-weight: 500; ">
            <div>Total</div>
            <div>${orderData.totalPrice}</div>
        </div>
    </div>
</div>
</div>

        
     
<div id="shippingContent" style="display:none;">
        <div class="shipping-cards-mobile" style="display:flex; gap: 24px;">
          <div class="modal-shipping-data" style="border-radius: 8px; border: 1px solid #e5e7eb; background-color: white; color: #6b7280; padding:16px; width: 100%;font-size: 14px;">
          <div class="modal-shipping-title" style="font-weight: 500; color: black;font-size: 16px;">Shipping Address</div>
             <div>${prof_name}</div>
             <div>${orderData.shippingAddress.address1}</div>
            <div>${orderData.shippingAddress.address2}</div>
            <div>${orderData.shippingAddress.city}, ${
    orderData.shippingAddress.province
  } ${orderData.shippingAddress.zip}</div>
                <div>${orderData.shippingAddress.country}</div>

      </div>

                     <div style="border-radius: 8px; border: 1px solid #e5e7eb; background-color: white; color: black; padding:16px; width: 100%;">
          <div class="modal-tracking-title" style="font-size: 16px;">Tracking Information</div>
          <div class="modal-tracking-content" style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280;"> 
           <div>Carrier</div>
           <div>UPS</div>
        </div>
                  <div class="modal-tracking-content" style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280;"> 
           <div>Tracking Number</div>
           <div style=" ">1Z999AA1234567890</div>
        </div>
                   <div class="modal-tracking-content" style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280;"> 
           <div>Estimated Delivery</div>
           <div>20/03/2024</div>
        </div>

        <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; border: 1px solid #e5e7eb; background-color: white; height: 36px; border-radius: 4px; padding-left: 12px; padding-right: 12px; color: #374151; width: 100%; margin-top: 10px; cursor: pointer;" class="track-order-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                 stroke-linejoin="round" class="track-ord-svg" style="height: 16px; width: 16px; margin-right: 4px;">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                <path d="M21 3v5h-5"></path>
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                                <path d="M8 16H3v5"></path>
                                </svg>
                   Track Package</button>

      </div>
    </div>
  </div>

        
<div id="paymentContent" style="display:none;">
        <div style="display:flex; flex-direction: column;">
             <div style="border-radius: 8px; border: 1px solid #e5e7eb; background-color: white; color: black; padding:16px">
        
             <div class="modal-payment-title" style="font-size: 16px;">Payment Information</div>
    
         <div class="modal-payment-content" style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280;">
            <div>Payment Method</div>
            <div>${orderData.paymentGateway}</div>
        </div>
        <div class="modal-payment-content" style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280;">
            <div>Order Total</div>
            <div style="font-weight: 500;">${orderData.totalPrice}</div>
        </div>
        <button class="modal-invoice-btn" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; border: 1px solid #e5e7eb; background-color: white; height: 36px; border-radius: 4px; padding-left: 12px; padding-right: 12px;cursor: pointer; margin-top: 10px;">
      
                            <svg class="dwnld-svg-modal" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                 stroke-linejoin="round" style="height: 16px; width: 16px; margin-right: 4px;">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" x2="12" y1="15" y2="3"></line>
                    </svg>
             Download Invoice
               </button>
  </div>
  <div style="border-radius: 8px; padding: 16px; margin-top: 24px; margin-bottom: 24px;border: 1px solid  #e5e7eb;">
    <div class="modal-order-summary-header" style="font-weight: 500; margin-bottom: 12px; font-size: 16px; color: black;">Order Summary</div>
    <div style="display: flex; flex-direction: column;">
        <div class="modal-order-summary" style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280;">
            <div>Subtotal</div>
            <div>${orderData.subtotalPrice}</div>
        </div>
        <div class="modal-order-summary" style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280;">
            <div>Discount</div>
            <div style="color: #ef4444;">-${orderData.total_discount}</div>
        </div>
     
        <div class="modal-order-summary" style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280;">ORDERCARD
            <div>Tax</div>
            <div>${orderData.total_tax ? orderData.total_tax : "-"}</div>
        </div>
        <div style="border-top: 1px solid #e5e7eb; height: 1px; width: 100%; margin: 8px 0; display: block;"></div>
        <div class="modal-order-total" style="display: flex; justify-content: space-between; font-weight: 500; ">
            <div>Total</div>
            <div>${orderData.totalPrice}</div>
        </div>
    </div>
</div>
    </div>




</div>
 <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: end; gap: 8px;">
                        <button class="modal-action-buttons" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; border: 1px solid #e5e7eb; background-color: white; height: 36px; border-radius: 4px; padding-left: 12px; padding-right: 12px; color: #ef4444; cursor: pointer;">
                          <svg class="modal-action-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" stroke-width="2" stroke-linecap="round"
                              stroke-linejoin="round" style="height: 16px; width: 16px; margin-right: 4px;">
                            <path d="M18 6 6 18"></path>
                            <path d="m6 6 12 12"></path>
                          </svg>
                          Cancel Order
                        </button>
                        <button class="modal-action-buttons" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; height: 36px; border-radius: 4px; padding-left: 12px; padding-right: 12px; background-color: #e2e8f0; color: #374151;border: none; font-weight: bold; cursor: pointer;">
              <svg class="modal-action-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 16px; width: 16px; margin-right: 4px;">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M8 16H3v5"></path>
              </svg>
              Re-order
            </button>
                        <button class="modal-action-buttons" id="xircls-order-details-close-btn" style="height: 36px; border-radius: 4px; padding-left: 16px; padding-right: 16px; background-color: #9c2140; color: white;border: none; cursor: pointer;"> Close </button>
                        </div>
`;

  modalContent.innerHTML = modalHeaderHTML + orderDetailsHTML;

  modal.appendChild(modalContent);

  // Add the modal to the body
  document.body.appendChild(modal);

  //JavaScript
  const itemsTab = document.getElementById("itemsTab");
  const shippingTab = document.getElementById("shippingTab");
  const paymentTab = document.getElementById("paymentTab");

  const itemsContent = document.getElementById("itemsContent");
  const shippingContent = document.getElementById("shippingContent");
  const paymentContent = document.getElementById("paymentContent");
  // Function to show the selected tab content and hide the others
  window.showTabContent = (tabName) => {
    // Hide all tab contents
    itemsContent.style.display = "none";
    shippingContent.style.display = "none";
    paymentContent.style.display = "none";

    // Reset tab styles
    itemsTab.style.backgroundColor = "";
    shippingTab.style.backgroundColor = "";
    paymentTab.style.backgroundColor = "";

    // Set 'active' styles for the selected tab
    if (tabName === "items") {
      itemsTab.style.backgroundColor = "#fbfaf8";
      itemsContent.style.display = "block";
    } else if (tabName === "shipping") {
      shippingTab.style.backgroundColor = "#fbfaf8";
      shippingContent.style.display = "block";
    } else if (tabName === "payment") {
      paymentTab.style.backgroundColor = "#fbfaf8";
      paymentContent.style.display = "block";
    }
  };

  // Close the modal when the close button is clicked
  const closeModalButton = document.getElementById(
    "xircls-order-details-close"
  );
  const closeModalBtn = document.getElementById(
    "xircls-order-details-close-btn"
  );

  closeModalButton.addEventListener("click", () => {
    document.body.removeChild(modal);
  });
  closeModalBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
  });
  // Close the modal when the user clicks outside the modal content
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });

  showTabContent("items");
}

async function renderRecentlyViewed() {
  const recentlyContainer = document.getElementById("RecentsContainer");

  try {
    let recentlyViewed =
      JSON.parse(sessionStorage.getItem("recentlyViewed")) || [];

    //  Updated the image URL using a more reliable method if Shopify.shop is undefined
    const updatedViewed = recentlyViewed.map((product) => ({
      ...product,
      image: product.image
        ? `https://${
            Shopify && Shopify.shop ? Shopify.shop : "your-default-shop"
          }/cdn/shop/${product.image}`
        : "default-image-url",
    }));

    console.log(updatedViewed, recentlyViewed, "recentlyViewed");

    if (updatedViewed.length === 0) {
      recentlyContainer.innerHTML = createEmptyCard("recentlyViewed");
      return;
    }

    const { wishlist } = await fetchWishlist(); // 🟡 Fetch ONCE
    console.log(wishlist, "wishlistttttttttt");

    let recentlyContent = `
        <div style="position: relative; height: 260px; margin-bottom: 32px; overflow: hidden; border-radius: 4px;">
          <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
            alt="Your Browsing History"
            style="width: 100%; height: 100%; object-fit: cover;">
          <div style="position: absolute; inset: 0; background: linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4)); display: flex; flex-direction: column; justify-content: center; padding-left: 32px; padding-right: 32px; color: white; text-align: left;">
            <div style="  font-size: 24px; margin-bottom: 8px;">Your Browsing History</div>
            <div style="font-size: 14px; max-width: 512px;">Revisit products you've recently explored</div>
          </div>
        </div>
  
        `;
    //  Generating the product cards HTML
    const productCards = updatedViewed
      .map((item) => {
        const encodedItem = encodeURIComponent(JSON.stringify(item));

        return `
        <div class="item-card" style="border-radius: 8px; border: 1px solid #e5e7eb; background-color: white; color: black; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); overflow: hidden; height: 100%; display: flex; flex-direction: column;">
          <div style="position: relative; overflow: hidden; height: 200px;">
            <div style="position: absolute; top: 12px; right: 12px; z-index: 2; display: flex; flex-direction: column; gap: 8px;">
              <button class="item-card-add-wishlist-btn" data-item-id=${
                item.id
              } onclick="addToWishlistHandler('${encodedItem}')"
 style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; height: 32px; width: 32px; border-radius: 50%; background-color: rgba(255, 255, 255, 0.8); border: none; cursor: pointer;">
                ${
                  wishlist.some((w) => w.id === item.id)
                    ? filledHeart
                    : outlineHeart
                }
              </button>
            </div>
            <img class="item-card-image" src="${item.image}"
              alt="${item.name}"
              >
          </div>
  
          <div style="padding: 24px; flex-grow: 1; padding-top: 16px; padding-bottom: 8px;">
            <div style="  font-size: 16px; margin-bottom: 4px;">${
              item.name
            }</div>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 12px;">
              ${item.type}
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <div style="font-weight: 500;">F${item.price}</div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="display: flex; align-items: center;">
                  <span style="width: 16px; height: 16px; border-radius: 50%; border: 1px solid #e5e7eb; margin-right: 4px; background-color: rgb(227, 188, 122);"
                    title="Shade: 4.5"></span>
                  <div style="font-size: 12px; color: #6b7280;">4.5</div>
                </div>
              </div>
            </div>
  
          </div>
  
          <div style="display: flex; align-items: center; padding: 24px; flex-direction: column; gap: 8px; padding-top: 0;">
            <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; border-radius: 4px; font-size: 14px; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; height: 40px; padding-left: 16px; padding-right: 16px; width: 100%; background-color: black; color: white; border:none; cursor:pointer;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 16px; width: 16px; margin-right: 8px;">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                <path d="M3 6h18"></path>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Buy Now
            </button>
            <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; border-radius: 4px; font-size: 14px; font-weight: 500; transition: background-color 0.2s, color 0.2s; outline: none; border: 1px solid #e5e7eb; background-color: white; height: 40px; padding-left: 16px; padding-right: 16px; width: 100%; cursor: pointer; border:1px solid black;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 16px; width: 16px; margin-right: 8px;">
                <circle cx="8" cy="21" r="1"></circle>
                <circle cx="19" cy="21" r="1"></circle>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
              </svg>
              Add to Cart
            </button>
          </div>
        </div>
      `;
      })
      .join("");

    //  Putting the content together
    recentlyContent += `
        <div id="recentlyItemsContainer" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
          ${productCards}
        </div>
      `;

    recentlyContainer.innerHTML = recentlyContent;
  } catch (error) {
    console.error("Error rendering recently viewed products:", error);
    recentlyContainer.innerHTML =
      "<div style='padding: 16px;'>Error loading recently viewed products.</div>";
  }
}

function renderSecurityContainer() {
  const securityContainer = document.getElementById("securityContainer");
  if (!securityContainer) return;

  const securityContent = `
      <div style="position: relative; top: 0; right: 0; bottom: 0; left: 0; background-color: rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; height: 260px;">
  <div style="color: white;   font-size: 32px; letter-spacing: 2px; text-align: center;">
    Security & Privacy
  </div>
</div>

  
      <div class="xircls-security-tablist" role="tablist" aria-orientation="horizontal" tabindex="0" style="display: flex;  align-items: center; justify-content: start; border-radius: 4px; padding: 4px; color: #6b7280; margin-bottom: 24px; margin-top: 24px; background-color: #f3f4f6; outline: none; width: fit-content;">
        <div id="tab-privacy" role="tab" aria-selected="true" aria-controls="content-privacy" tabindex="0"
          style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; padding: 6px 12px; font-size: 14px; font-weight: 500; border-radius: 4px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); background-color: #ffffff; color: #000000; transition: all 0.2s;">
          Data Sharing & Privacy
        </div>
        <div id="tab-password" role="tab" aria-selected="false" aria-controls="content-password" tabindex="-1"
          style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; padding: 6px 12px; font-size: 14px; font-weight: 500; border-radius: 4px; color: #6b7280; transition: all 0.2s;">
          Change Password
        </div>
        <div id="tab-account" role="tab" aria-selected="false" aria-controls="content-account" tabindex="-1"
          style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; padding: 6px 12px; font-size: 14px; font-weight: 500; border-radius: 4px; color: #6b7280; transition: all 0.2s;">
          Account Management
        </div>
      </div>
  
      <div id="content-privacy" style="display: block;">
      <div class="rounded-lg" style="border: 1px solid #e0e0e0; background-color: #fff; color: #000; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
  <div style="display: flex; flex-direction: column; padding: 24px;">
    <div style="font-size: 24px; text-align: left;  display: flex; align-items: center; gap: 8px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 20px; width: 20px; stroke:#000;">
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
        <path d="m9 12 2 2 4-4"></path>
      </svg>
      Privacy Settings
    </div>
    <div style="font-size: 14px; color: #71717a; text-align: left;">Control how your information is used and shared</div>
  </div>
  <div style="padding: 24px; padding-top: 0; text-align: left;">
    <form style="display: flex; flex-direction: column; gap: 32px;">
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="font-size: 18px;">Data Usage</div>
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 8px; border: 1px solid #e0e0e0; padding: 16px; border-radius: 8px;">
          <div class="data-usage-cards" style="display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 16px;">Data Sharing</div>
            <div style="font-size: 14px; color: #71717a;">Allow Armani Beauty to share your data with trusted partners for improved services</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="dataSharing" style="opacity:0;width:0;height:0;">
            <span class="slider round"></span>
          </label>
        </div>

        <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 8px; border: 1px solid #e0e0e0; padding: 16px; border-radius: 8px;">
          <div class="data-usage-cards" style="display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 16px;">Third-Party Data Sharing</div>
            <div style="font-size: 14px; color: #71717a;">Allow third-party services to access your account information</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="thirdPartySharing" style="opacity:0;width:0;height:0;">
            <span class="slider round"></span>
          </label>
        </div>

        <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 8px; border: 1px solid #e0e0e0; padding: 16px; border-radius: 8px;">
          <div class="data-usage-cards" style="display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 16px;">Location Services</div>
            <div style="font-size: 14px; color: #71717a;">Allow Armani Beauty to use your location to provide localized experiences</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="locationServices" checked style="opacity:0;width:0;height:0;">
            <span class="slider round"></span>
          </label>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="font-size: 18px;">Cookie Preferences</div>
        <div style="background-color: rgba(0, 0, 0, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <div style="display: flex; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 20px; width: 20px; color: #71717a;">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
            <div style="font-size: 14px; color: #71717a;">Necessary cookies are always enabled as they are essential for the website to function properly.</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: row; align-items: flex-start; gap: 12px;">
          <input type="checkbox" id="necessaryCookies" disabled checked style="height: 16px; width: 16px; opacity: 0.5; cursor: not-allowed;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 14px;">Necessary Cookies <div style="display: inline-flex; align-items: center; border-radius: 9999px; padding: 2px 10px; font-size: 12px; font-weight: 600; transition: background-color 0.2s ease-in-out; color: #000; border: 1px solid #e0e0e0;">Required</div></div>
            <div style="font-size: 14px; color: #71717a;">These cookies are essential for the website to function properly and cannot be disabled.</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: row; align-items: flex-start; gap: 12px;">
          <input type="checkbox" id="functionalCookies" checked style="height: 16px; width: 16px;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 14px;">Functional Cookies</div>
            <div style="font-size: 14px; color: #71717a;">These cookies enable personalized features and functionality on our website.</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: row; align-items: flex-start; gap: 12px;">
          <input type="checkbox" id="analyticsCookies" checked style="height: 16px; width: 16px;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 14px;">Analytics Cookies</div>
            <div style="font-size: 14px; color: #71717a;">These cookies help us understand how visitors interact with our website, helping us improve our services.</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: row; align-items: flex-start; gap: 12px;">
          <input type="checkbox" id="advertisingCookies" style="height: 16px; width: 16px;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 14px;">Advertising Cookies</div>
            <div style="font-size: 14px; color: #71717a;">These cookies are used to deliver advertisements more relevant to you and your interests.</div>
          </div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="font-size: 18px;">Marketing Preferences</div>

        <div style="display: flex; flex-direction: row; align-items: flex-start; gap: 12px;">
          <input type="checkbox" id="emailMarketing" checked style="height: 16px; width: 16px;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 14px;">Email Marketing</div>
            <div style="font-size: 14px; color: #71717a;">Receive product updates, offers, and news via email</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: row; align-items: flex-start; gap: 12px;">
          <input type="checkbox" id="smsNotifications" style="height: 16px; width: 16px;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 14px;">SMS Notifications</div>
            <div style="font-size: 14px; color: #71717a;">Receive text messages about promotions and updates</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: row; align-items: flex-start; gap: 12px;">
          <input type="checkbox" id="phoneCalls" style="height: 16px; width: 16px;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 14px;">Phone Calls</div>
            <div style="font-size: 14px; color: #71717a;">Allow customer service to contact you by phone</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: row; align-items: flex-start; gap: 12px;">
          <input type="checkbox" id="directMail" checked style="height: 16px; width: 16px;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 14px;">Direct Mail</div>
            <div style="font-size: 14px; color: #71717a;">Receive catalogs and special offers by mail</div>
          </div>
        </div>
      </div>

      <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; border-radius: 8px; font-size: 14px; font-weight: 500; transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out; padding: 8px 16px; height: 40px; background-color: #000; color: #fff; padding: 10px 16px; border: none; outline: none; cursor: pointer; width: fit-content;" type="submit">Save Privacy Settings</button>
    </form>
  </div>
</div>
</div>
      </div>
      <div id="content-password" style="display: none;">
      <div class="rounded-lg" style="border: 1px solid #e0e0e0; background-color: #fff; color: #000; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
  <div style="display: flex; flex-direction: column; padding: 24px;">
    <div style="font-size: 24px; text-align: left;  display: flex; align-items: center; gap: 8px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 20px; width: 20px;">
        <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
        <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
      </svg>
      Password Security
    </div>
    <div style="font-size: 14px; color: #71717a; text-align: left;">Update your password to keep your account secure</div>
  </div>
  <div style="padding: 24px; padding-top: 0; text-align: left;">
    <form id="passwordForm" style="display: flex; flex-direction: column; gap: 24px;">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size: 14px;">Current Password</div>
        <div style="position: relative;">
          <input type="password" id="currentPassword" name="currentPassword" style="height: 40px; width: 100%; border: 1px solid #e0e0e0; border-radius: 8px; padding: 8px 12px; font-size: 14px; box-sizing: border-box; padding-right: 40px;">
          <button type="button" onclick="togglePassword('currentPassword', this)" style="position: absolute; right: 0; top: 0; height: 100%; width: 40px; display: flex; align-items: center; justify-content: center; background-color: transparent; border: none; cursor: pointer; color: #71717a;">
            <svg id="eyeIcon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 16px; width: 16px;">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
  <svg id="eyeDashIcon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off h-4 w-4" style="height: 16px; width: 16px; display: none;"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path><path d="m2 2 20 20"></path></svg>
          </button>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size: 14px;">New Password</div>
        <div style="position: relative;">
          <input type="password" id="newPassword" name="newPassword" style="height: 40px; width: 100%; border: 1px solid #e0e0e0; border-radius: 8px; padding: 8px 12px; font-size: 14px; box-sizing: border-box; padding-right: 40px;">
          <button type="button" onclick="togglePassword('newPassword', this)" style="position: absolute; right: 0; top: 0; height: 100%; width: 40px; display: flex; align-items: center; justify-content: center; background-color: transparent; border: none; cursor: pointer; color: #71717a;">
           <svg id="eyeIcon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 16px; width: 16px;">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
  <svg id="eyeDashIcon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off h-4 w-4" style="height: 16px; width: 16px; display: none;"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path><path d="m2 2 20 20"></path></svg>
          </button>
        </div>
        <div style="font-size: 14px; color: #71717a;">Password must be at least 8 characters and include uppercase, lowercase, number, and special character.</div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size: 14px;">Confirm New Password</div>
        <div style="position: relative;">
          <input type="password" id="confirmPassword" name="confirmPassword" style="height: 40px; width: 100%; border: 1px solid #e0e0e0; border-radius: 8px; padding: 8px 12px; font-size: 14px; box-sizing: border-box; padding-right: 40px;">
          <button type="button" onclick="togglePassword('confirmPassword', this)" style="position: absolute; right: 0; top: 0; height: 100%; width: 40px; display: flex; align-items: center; justify-content: center; background-color: transparent; border: none; cursor: pointer; color: #71717a;">
  <svg id="eyeIcon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 16px; width: 16px;">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
  <svg id="eyeDashIcon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off h-4 w-4" style="height: 16px; width: 16px; display: none;"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path><path d="m2 2 20 20"></path></svg>
</button>
        </div>
      </div>

      <div style="margin-top: 8px;">
      <div style="border: 1px solid #E5E7EB; padding: 16px; display: flex; align-items: flex-start;margin-bottom: 24px;border-radius: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 20px; width: 20px; color: #F59E0B; margin-right: 12px; margin-top: 2px; flex-shrink: 0;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div style=" font-size: 14px; color: #4B5563; ">
              For security reasons, you'll be automatically logged out after changing your password and will need to log in again with your new credentials.
          </div>
      </div>
        <button type="submit" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; border-radius: 8px; font-size: 14px; font-weight: 500; transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out; padding: 8px 16px; height: 40px; background-color: #000; color: #fff; padding: 10px 16px; border: none; outline: none; cursor: pointer;">Update Password</button>
      </div>
    </form>

    <div style="margin-top: 32px; border-top: 1px solid #e0e0e0; padding-top: 32px;">
      <div style="font-size: 18px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 20px; width: 20px; color: #f59e0b;">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
          <path d="M12 8v4"></path>
          <path d="M12 16h.01"></path>
        </svg>
        Password Security Tips
      </div>
      <ul style="padding-left: 0; list-style: none; font-size: 14px;">
        <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
          <span style="color: #f59e0b; margin-right: 8px;">•</span>
          <span>Use a unique password for each of your accounts</span>
        </li>
        <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
          <span style="color: #f59e0b; margin-right: 8px;">•</span>
          <span>Include a mix of letters, numbers, and symbols</span>
        </li>
        <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
          <span style="color: #f59e0b; margin-right: 8px;">•</span>
          <span>Avoid using easily guessable information like birthdays or names</span>
        </li>
        <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
          <span style="color: #f59e0b; margin-right: 8px;">•</span>
          <span>Change your password periodically for better security</span>
        </li>
      </ul>
    </div>
  </div>
</div>
      </div>
      <div id="content-account" style="display: none;">
      <div class="rounded-lg" style="border: 1px solid #e0e0e0; background-color: #fff; color: #000; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
  <div style="display: flex; flex-direction: column; padding: 24px;">
    <div style="font-size: 24px; text-align: left;  display: flex; align-items: center; gap: 8px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 20px; width: 20px;">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      Account Management
    </div>
    <div style="font-size: 14px; color: #71717a; text-align: left;">Manage your account settings and data</div>
  </div>
  <div style="padding: 24px; padding-top: 0; text-align: left;">
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div>
        <div style="font-size: 18px; margin-bottom: 16px;">Your Data</div>
        <div style="color: #71717a; margin-bottom: 16px;">Download a copy of your personal data or delete your account.</div>
        <div style="display: flex; flex-direction: column; gap: 16px;">

          <div style="background-color: #
fff; color: #000; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="display: flex; flex-direction: column; padding: 24px; padding-bottom: 8px;">
              <div style="font-size: 16px; display: flex; align-items: center; gap: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 16px; width: 16px;">
                  <path d="M12 13v8l-4-4"></path>
                  <path d="m12 21 4-4"></path>
                  <path d="M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284"></path>
                </svg>
                Export Your Data
              </div>
              <div style="font-size: 14px; color: #71717a;">Download a complete copy of your personal information</div>
            </div>
            <div style="display: flex; align-items: center; padding: 24px; padding-top: 8px;">
              <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; border-radius: 8px; font-size: 14px; font-weight: 500; transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out; padding: 8px 16px; height: 40px; border: 1px solid #e0e0e0; background-color: #fff; color: #000; cursor: pointer;">Request Data Export</button>
            </div>
          </div>

          <div style="background-color: #fff; color: #000; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px;">
            <div style="display: flex; flex-direction: column; padding: 24px; padding-bottom: 8px;">
              <div style="font-size: 16px; display: flex; align-items: center; gap: 8px; color: #ef4444;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 16px; width: 16px;">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  <line x1="10" x2="10" y1="11" y2="17"></line>
                  <line x1="14" x2="14" y1="11" y2="17"></line>
                </svg>
                Delete Account
              </div>
              <div style="font-size: 14px; color: #71717a;">Permanently delete your account and all associated data</div>
            </div>
            <div style="display: flex; align-items: center; padding: 24px; padding-top: 8px;">
              <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; border-radius: 8px; font-size: 14px; font-weight: 500; transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out; padding: 8px 16px; height: 40px; background-color: #ef4444; color: #fff; cursor: pointer; border: none;">Delete My Account</button>
            </div>
          </div>
        </div>
      </div>

      <div style="background-color: #fff8e1; border: 1px solid #fcd9a2; border-radius: 8px; padding: 16px;">
        <div style="display: flex;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 20px; width: 20px; color: #f59e0b; margin-right: 8px; flex-shrink: 0; margin-top: 4px;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <div>
            <div style="font-size: 16px; color: #794500; margin-bottom: 4px;">Important Information</div>
            <div style="font-size: 14px; color: #794500;">Deleting your account is permanent and cannot be undone. All your data, including order history, profile information, and saved items will be permanently removed.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
      </div>
    `;

  // ✅ Set content first
  securityContainer.innerHTML = securityContent;

  // ✅ Then bind event listeners
  const tabs = ["privacy", "password", "account"];
  tabs.forEach((tab) => {
    const el = document.getElementById(`tab-${tab}`);
    if (!el) return;

    el.addEventListener("click", () => {
      tabs.forEach((innerTab) => {
        const tabDiv = document.getElementById(`tab-${innerTab}`);
        const contentDiv = document.getElementById(`content-${innerTab}`);

        if (!tabDiv || !contentDiv) return;

        if (innerTab === tab) {
          tabDiv.setAttribute("aria-selected", "true");
          tabDiv.setAttribute("tabindex", "0");
          tabDiv.style.backgroundColor = "#ffffff";
          tabDiv.style.color = "#000000";
          tabDiv.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
          contentDiv.style.display = "block";
        } else {
          tabDiv.setAttribute("aria-selected", "false");
          tabDiv.setAttribute("tabindex", "-1");
          tabDiv.style.backgroundColor = "transparent";
          tabDiv.style.color = "#6b7280";
          tabDiv.style.boxShadow = "none";
          contentDiv.style.display = "none";
        }
      });
    });
  });

  // ✅ Capture form data
  const passwordForm = document.getElementById("passwordForm");
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Prevent the default form submission

      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      console.log("Current Password:", currentPassword);
      console.log("New Password:", newPassword);
      console.log("Confirm New Password:", confirmPassword);
      if (newPassword !== confirmPassword) {
        // alert("New password and confirm password do not match.");
        createStatusToast(
          "Password Invalid",
          "New password and Confirm password do not match. Please verify your passwords and try again.",
          "error"
        );
        return;
      }
      if (newPassword.length < 8) {
        // alert("New password must be at least 8 characters long.");
        createStatusToast(
          "Password Invalid",
          "New password must be at least 8 characters long.  Please verify your passwords and try again",
          "error"
        );
        return;
      }
      try {
        // Get stored theme for comparison (this part looks unrelated to password change, so I am keeping it, but review if it's really needed)

        const url = `https://omc.axentraos.co.in/customer_profile/update_customer_password/`;

        // **Create a JSON payload**
        const payload = {
          shop: Shopify.shop,
          app: "oh_my_customer",
          customerId: customerId,
          newPassword: newPassword,
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // **Set the Content-Type header**
          },
          body: JSON.stringify(payload), // **Stringify the JSON payload**
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage =
            errorData.message || `HTTP error! Status: ${response.status}`;

          // alert(`Password update failed: ${errorMessage}`);
          createStatusToast(
            "Password Change Failed",
            "We couldn’t update your password. Please verify your current password and try again.",
            "error"
          );
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("API Response:", data);

        // alert("Password updated successfully!");
        createStatusToast(
          "Password Changed",
          "Your password has been updated successfully. Make sure to keep it secure.",
          "success"
        );
        setTimeout(() => {
          Logout();
        }, 2000);
      } catch (error) {
        console.error("Password update failed:", error);
      }
      // You would typically send this data to a server for processing here
    });
  }
}
function togglePassword(inputId, button) {
  const passwordInput = document.getElementById(inputId);
  const eyeIcon = button.querySelector("#eyeIcon");
  const eyeDashIcon = button.querySelector("#eyeDashIcon");

  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);

  eyeIcon.style.display = type === "password" ? "block" : "none";
  eyeDashIcon.style.display = type === "password" ? "none" : "block";
}

async function renderDashboard(orders) {
  const dashboardContainer = document.getElementById("dashboardContainer");
  if (!dashboardContainer) {
    console.error("Dashboard container not found!");
    return;
  }

  const latestOrders = orders.slice(0, 3);
  const { wishlist } = await fetchWishlist();
  const generateRecentOrdersHTML = (orders) => {
    const orderItemsHTML = orders
      .map((order) => {
        const itemDetailsHTML = order.items
          .map(
            (item) => `
                <div class="recent-item-details" style="display: flex; flex-wrap: nowrap; gap: 16px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
                    <div style="width: 80px; height: 80px; background-color: #f9f9f9; flex-shrink: 0;">
                        <img src="${item.image}" alt="${
              item.name
            }" style="width: 100%; height: 100%; object-fit: cover; object-position: center;">
                    </div>
                    <div style="flex-grow: 1; text-align: left; width: 100%">
                        <div style="  font-size: 14px; margin-bottom: 4px;">${
                          item.title
                        }</div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${
                          item.shade
                            ? `Shade: ${item.shade}`
                            : item.size
                            ? `Size: ${item.size}`
                            : ""
                        }</div>
                        <div style="font-size: 12px; color: #6b7280;">Qty: ${
                          item.quantity
                        }</div>
                    </div>
                    <div class="recent-order-buy-again" style="text-align: right; width: 100%; justify-content: space-between; align-items: center;">
                        <div style="font-size: 14px;">${item.price}</div>
                        <button style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #007bff; text-decoration: underline; background-color: transparent; border: none; cursor: pointer; margin-top: 8px; padding: 0px">Buy Again</button>
                    </div>
                </div>
            `
          )
          .join("");

        return `
                <div class="recentOrdersContainer" style="border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden; margin-bottom: 24px;">
                    <div style="background-color: #f9f9f9; padding: 16px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;">
                        <div style="text-align: left;">
                            <div style="font-size: 14px; font-weight: 600;">Order ${order.orderNumber}</div>
                            <div style="font-size: 12px; color: #6b7280; margin-top: -8px;">Placed on ${order.orderDate}</div>
                        </div>
                        <div>
                            <span style="display: inline-block; padding: 2px 8px; font-size: 10px; border-radius: 9999px; border: 1px solid black;">
                              ${order.fulfillmentStatus}
                            </span>
                        </div>
                        <div class="recent-show-details-btn-div">
                            <button
  style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #007bff; text-decoration: underline; background-color: transparent; border: none; cursor: pointer; display: flex; align-items: center; padding: 0px;"
  onclick="toggleOrderDetails(this)"
>
  <span class="label">Show Details</span>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 12px; height: 12px; margin-left: 4px;">
    <path class="toggle-icon" d="m6 9 6 6 6-6"/>
  </svg>
</button>

                        </div>
                    </div>
                    <div class="order-details" style="padding: 16px; display: none;">
                        ${itemDetailsHTML}
                        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px solid #e5e7eb">
                            <div style="text-align: left;">
                                <div style="font-size: 14px;">Total: <span style="font-weight: 500;">${order.totalPrice}</span> (incl. taxes)</div>
                                <div style="font-size: 12px; color: #6b7280;">Paid with ${order.paymentGateway}</div>
                            </div>
                            <div>
                                <a href="#track-order" style="display: inline-block; background-color: black; color: white; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding: 8px 16px; text-decoration: none; transition: background-color 0.3s; cursor: pointer;" onmouseover="this.style.backgroundColor='#007bff'" onmouseout="this.style.backgroundColor='black'">Track Order</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");

    return `
            <div style="margin-bottom: 32px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div style="font-size: 18px;  ">Recent Orders</div>
                    <button style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #007bff; text-decoration: underline; border:none; background-color:transparent; cursor:pointer;" onclick="renderContent(1)">View All</button>
                </div>
                ${orderItemsHTML}
            </div>
        `;
  };

  const dashboardContent = `
        <div style="position: relative; height: 260px; overflow: hidden; border-radius: 4px; margin-bottom: 32px; text-align: left">
            <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" alt="Welcome back, ${prof_name}" style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; inset: 0; background: linear-gradient(to right, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.1) 100%); display: flex; flex-direction: column; justify-content: center; padding: 0 32px; color: #fff;">
                <div style="font-size: 30px;">Welcome back, ${prof_name}</div>
                <div class="xircls-dashboard-header-subtitle" style="font-size: 14px; max-width: 50%;">Experience the luxury of Armani Beauty with your personalized dashboard.</div>
            </div>
        </div>

        <div class="xircls-dashboard-cards" style="display: flex; gap: 24px; margin-bottom: 32px; width: 100%;">
            <div style="flex: 1; border: 1px solid #e0e0e0; background-color: #fff; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-radius: 4px;">
                <div style="padding: 20px; text-align: center;">
                    <div style="font-size: 30px; ">${orders.length}</div>
                    <div style="font-size: 14px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">Orders</div>
                </div>
            </div>

            <div style="flex: 1; border: 1px solid #e0e0e0; background-color: #fff; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-radius: 4px;">
                <div style="padding: 20px; text-align: center;">
                    <div style="font-size: 30px; ">${wishlist.length}</div>
                    <div style="font-size: 14px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">Wishlist Items</div>
                </div>
            </div>

            <div style="flex: 1; border: 1px solid #e0e0e0; background-color: #fff; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); border-radius: 4px;">
                <div style="padding: 20px; text-align: center;">
                    <div style="font-size: 30px;">750</div>
                    <div style="font-size: 14px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">Loyalty Points</div>
                </div>
            </div>
        </div>

        ${generateRecentOrdersHTML(latestOrders)}

        
        <div style="margin-top: 48px; margin-bottom: 16px; display: flex; justify-content: center; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px; color: #71717a; font-size: 14px;">
                <div style="font-size: 12px; font-weight: 300;">Powered by</div>
                <img src="/@fs/home/sys17/Desktop/ArmaniTemplate-CA/attached_assets/XIRCLLOGO.png" alt="XIRCLS" style="height: 16px;">
            </div>
        </div>
    `;

  dashboardContainer.innerHTML = dashboardContent;
}
function toggleOrderDetails(button) {
  const recentOrdersContainer = button.closest(".recentOrdersContainer");
  const orderDetails = recentOrdersContainer.querySelector(".order-details");
  const iconPath = button.querySelector(".toggle-icon");
  const label = button.querySelector(".label");

  const isHidden = getComputedStyle(orderDetails).display === "none";
  if (isHidden) {
    orderDetails.style.display = "block";
    label.textContent = "Hide Details";
    iconPath.setAttribute("d", "m18 15-6-6-6 6"); // chevron-up
  } else {
    orderDetails.style.display = "none";
    label.textContent = "Show Details";
    iconPath.setAttribute("d", "m6 9 6 6 6-6"); // chevron-down
  }
}

async function fetchWishlist() {
  if (customerId) {
    try {
      const metafieldResponse = await fetch(
        `https://${baseUrl}/api/v1/get_metafield/?customerId=${customerId}&shop=${Shopify.shop}&app=oh_my_customer`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const metafieldData = await metafieldResponse.json();
      if (
        metafieldData.metafields &&
        Array.isArray(metafieldData.metafields.metafields)
      ) {
        const existingMetafield = metafieldData.metafields.metafields.find(
          (metafield) =>
            metafield.namespace === "wishlist" && metafield.key === "items"
        );
        if (existingMetafield) {
          console.log(
            "metafield idd is getting",
            JSON.parse(existingMetafield.value)
          );
          return {
            id: existingMetafield.id,
            wishlist: JSON.parse(existingMetafield.value),
          };
        } else {
          const createdMetafield = await createMetafield(); // Create new metafield
          return { id: createdMetafield.id, wishlist: [] };
        }
      } else {
        const createdMetafield = await createMetafield(); // Create new metafield
        return { id: createdMetafield.id, wishlist: [] };
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      return { id: null, wishlist: [] };
    }
  } else {
    const wishlist = JSON.parse(sessionStorage.getItem("wishlist")) || [];
    console.log("Logged out - Current wishlist from sessionStorage:", wishlist);
    return { id: null, wishlist: wishlist };
  }
}

async function addToWishlistHandler(item) {
  item = JSON.parse(decodeURIComponent(item));
  console.log(item, "itemmmmmmmm");
  if (!item || !item.id) {
    console.error("Invalid item passed to addToWishlistHandler");
    createStatusToast(
      "Wishlist Update Failed",
      "We couldn’t update your wishlist. Please try again.",
      "error"
    );
    return;
  }

  try {
    const { id: metafieldId, wishlist } = await fetchWishlist();

    const itemIndex = wishlist.findIndex(
      (wishlistItem) => wishlistItem.id === item.id
    );
    const heartButton = document.querySelector(
      `.item-card-add-wishlist-btn[data-item-id="${item.id}"]`
    );
    const itemId = item.id;
    if (itemIndex !== -1) {
      // Remove item from wishlist
      wishlist.splice(itemIndex, 1);
      await saveWishlist(wishlist, metafieldId, itemId);

      console.log("Item removed from wishlist:", item.id);
      createStatusToast(
        "Removed from Wishlist",
        "This item has been successfully removed and is no longer saved in your wishlist.",
        "success"
      );

      if (heartButton) {
        heartButton.innerHTML = outlineHeart; // Outline
        heartButton.title = "Add to Wishlist";
        heartButton.style.color = "";
      }
    } else {
      // Add item to wishlist
      const itemToAdd = {
        id: item.id,
        name: item.name || "Unknown Product",
        image: item.image || "",
        price: item.price || "N/A",
        url: item.url || "#",
        variants: item.variants || [],
        dateAdded: new Date().toISOString(),
      };

      const updatedWishlist = [...wishlist, itemToAdd];
      await saveWishlist(updatedWishlist, metafieldId, itemId);

      console.log("Item added to wishlist:", itemToAdd);
      createStatusToast(
        "Added to Your Wishlist",
        "This item is now saved! You can view it anytime in your wishlist.",
        "success"
      );

      if (heartButton) {
        heartButton.innerHTML = filledHeart; // Solid
        heartButton.title = "Remove from Wishlist";
        heartButton.style.color = "red";
      }
    }

    const wishlistContainer = document.getElementById("wishListsContainer");
    if (wishlistContainer && wishlistContainer.style.display !== "none") {
      await fetchWishlistOnReload();
    }
  } catch (error) {
    console.error("Error toggling wishlist item:", error);
    createStatusToast(
      "Wishlist Update Failed",
      "We couldn’t update your wishlist. Please try again.",
      "error"
    );
  } finally {
    hideLoader();
  }
}
async function removeFromWishlist(itemId) {
  console.log("itemId to remove:", itemId);
  try {
    // Fetch wishlist data to get the current items
    const response = await fetch(
      `https://${baseUrl}/api/v1/get_metafield/?customerId=${customerId}&shop=${Shopify.shop}&app=oh_my_customer`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    // Find the wishlist metafield in the response
    const wishlistMetafield = data.metafields.metafields.find(
      (metafield) =>
        metafield.namespace === "wishlist" && metafield.key === "items"
    );
    console.log("wishlistMetafield", wishlistMetafield);
    if (!wishlistMetafield) {
      console.error("No wishlist metafield found.");
      return;
    }

    const wishlist = JSON.parse(wishlistMetafield.value); // Parse the existing wishlist
    const updatedWishlist = wishlist.filter((item) => item.id !== itemId); // Remove the item by id
    console.log("wishlist", wishlist);
    console.log("updatedWishlist", updatedWishlist);
    // Prepare the updated metafield data
    const updatedMetafield = {
      customerId: customerId,
      shop: Shopify.shop,
      app: "oh_my_customer",
      metafieldId: wishlistMetafield.id, // Use the metafield ID here
      productId: itemId,
      metafield: {
        id: wishlistMetafield.id,
        namespace: "wishlist",
        key: "items",
        value: JSON.stringify(updatedWishlist), // Save the updated wishlist
        type: "json",
      },
    };

    // Send the updated wishlist back to the server to update the metafield
    await fetch(`https://${baseUrl}/api/v1/update_metafield/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedMetafield),
    });
    console.log("updated wishlist meta field");
    // alert("Item Successfully Removed From Wishlist!");
    createStatusToast(
      "Removed from Wishlist",
      "This item has been successfully removed and is no longer saved in your wishlist.",
      "success"
    );
    // Re-render the wishlist after updating
    renderWishlist(updatedWishlist);
  } catch (error) {
    console.error("Error removing item from wishlist:", error);
  } finally {
    setTimeout(() => window.location.reload(), 500);
  }
}

function renderMobileMenu() {
  console.log("menu updated!11!!");
  const menuElementMobile = document.getElementById("xircls-mobile-menu");
  menuElementMobile.innerHTML = ""; // Clear previous menu items
  console.log(menuElementMobile, menuOptions, "menuElements1122");
  const menuOptions2 = menuOptions.map((option, index) => ({
    ...option,
    originalIndex: index,
  })); // Store original index
  // .filter(option => elementsObj[option.id].enabled=== true); // Filter based on elementsObj

  if (menuElementMobile) {
    // Filter or select specific items for mobile if needed.
    // For now, using the first 5 items as per the image, or all items if fewer than 5.

    menuOptions2.forEach((item, index) => {
      const divElement = document.createElement("div");
      divElement.dataset.index = item.originalIndex;
      divElement.className = "xircls-menu-item";
      // Ensure icons are SVGs or use appropriate tags if they are font icons
      divElement.innerHTML = `
                  <span class="xircls-menu-icon">${item.icon}</span>
                  <span class="xircls-menu-label">${item.mobileLabel}</span>
              `;
      divElement.onclick = () => {
        console.log(`Mobile Menu: Clicked on ${item.heading}, index ${index}`);
        if (typeof renderContent === "function") {
          renderContent(parseInt(divElement.dataset.index)); // Ensure this maps to the correct content
        }
        setActiveMenuItem(index);
      };
      menuElementMobile.appendChild(divElement);
    });
  }
  console.log(menuOptions2, "menuOptions2");

  // Sort by originalIndex to ensure correct order
  const sortedMenu = [...menuOptions2].sort(
    (a, b) => a.originalIndex - b.originalIndex
  );
  console.log(sortedMenu, "sortedmenue");
  // Get the first item based on originalIndex
  const firstItem = sortedMenu[0];
  console.log(firstItem.originalIndex, "firstItem");
  if (typeof renderContent === "function") {
    renderContent(firstItem.originalIndex); // Pass the first item
  }

  setActiveMenuItem(0); // Also pass it here
}

function setActiveMenuItem(activeIndex) {
  // Deactivate all items in mobile menu
  const mobileItems = document.querySelectorAll(
    "#xircls-mobile-menu .xircls-menu-item"
  );
  mobileItems.forEach((item) => item.classList.remove("active"));
  if (mobileItems[activeIndex]) {
    mobileItems[activeIndex].classList.add("active");
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const menuElementMobile = document.getElementById("xircls-mobile-menu");

  if (menuElementMobile) {
    menuElementMobile.innerHTML = "";

    menuOptions.forEach((item, index) => {
      const divElement = document.createElement("div");
      divElement.className = "xircls-menu-item";
      // Ensure icons are SVGs or use appropriate tags if they are font icons
      divElement.innerHTML = `
              <span class="xircls-menu-icon">${item.icon}</span>
              <span class="xircls-menu-label">${item.mobileLabel}</span>
          `;
      divElement.onclick = () => {
        console.log(`Mobile Menu: Cliscked on ${item.heading}, index ${index}`);
        window.scrollTo({
          top: 0,
          behavior: "smooth", // Optional for smooth scrolling
        });
        if (typeof renderContent === "function") {
          renderContent(index); // Ensure this maps to the correct content
        }
        setActiveMenuItem(index);
      };
      menuElementMobile.appendChild(divElement);
    });
  }
});

function createEmptyCard(type, searchParam) {
  let icon = "";
  let title = "";
  let message = "";
  let clearSearchButton = "";

  switch (type) {
    case "wishlist":
      icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 24px; width: 24px; color: #888;">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>`;
      title = "Your wishlist is empty";
      message = searchParam
        ? `No items found matching "${searchParam}"`
        : "Add items to your wishlist to see them here.";
      break;
    case "recentlyViewed":
      icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history w-5 h-5 mr-2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path></svg>`;
      title = "No recently viewed items";
      message = searchParam
        ? `No items found matching "${searchParam}"`
        : "You haven't viewed any products recently.";
      break;
    case "orders":
      icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package h-6 w-6 text-primary"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"></path><path d="m7.5 4.27 9 5.15"></path></svg>`;
      title = "No orders found";
      message = searchParam
        ? `No items found matching "${searchParam}"`
        : "You haven't placed any orders yet.";
      break;
    case "search":
      icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart w-5 h-5 mr-2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>`;
      title = "No Items Found";
      message = `No items found matching "${searchParam}"`;
      break;
    default:
      icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height: 24px; width: 24px; color: #888;">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
          <path d="M3 6h18"></path>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>`;
      title = "No items found";
      message = "No items to display.";
  }

  return `
    <div style="text-align: center; padding: 48px; border-radius: 8px; border: 1px solid #ccc;">
      <div style="margin: 0 auto; width: 48px; height: 48px; border-radius: 50%; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        ${icon}
      </div>
      <div style="font-size: 18px; font-weight: 500; margin-bottom: 8px;">${title}</div>
      <div style="font-size: 14px; color: #666; margin-bottom: 24px;">${message}</div>
      ${clearSearchButton}
    </div>
  `;
}
async function handleLoyaltySubmit(value1) {
  // const input = document.getElementById("loyalty-input");
  // const value = input.value.trim();
  const value = value1;

  if (!value || isNaN(value)) {
      console.log("Points input is empty or not a valid number.");
      return;
  }

  const formData = new FormData();
  formData.append("shop", Shopify.shop);
  formData.append("app", "oh_my_customer");
  formData.append("email", profile_email);
  formData.append("points", parseInt(value, 10));

  try {
      const response = await fetch(
          "https://omc.axentraos.co.in/loyalty/redeem_points/",
          {
              method: "POST",
              body: formData,
          }
      );

      const data = await response.json();
      console.log("Response from server:", data);
      createStatusToast("Points Redeemed Successfully", "Your loyalty points have been applied. Enjoy your rewards!", "success")

      location.href = `/discount/${data.discount_code}/?redirect=${location.pathname}`;
      LoyaltyPoints()
      return;
  } catch (error) {
      createStatusToast("Couldn’t Redeem Points", "We couldn’t process your redemption. Please try again or contact support for assistance", "error")

      console.error("❌ Error during POST request:", error);
  }
}
function customRedeemModal(totalPoints, redemPoints) {
  const modal = document.createElement("div");
  modal.className = "customRedeemModal xircls-modal-overlay";
  const halfPoints = totalPoints * 50 / 100 ;
  modal.innerHTML = `
    <div class="xircls-modal">
      <button class="xircls-modal-close" onclick="document.querySelector('.customRedeemModal').remove()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
        <span class="sr-only">Close</span>
      </button>
      
      <div class="xircls-modal-header">
        <h2 class="xircls-modal-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gift-icon">
            <rect x="3" y="8" width="18" height="4" rx="1"></rect>
            <path d="M12 8v13"></path>
            <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path>
            <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path>
          </svg>
          Redeem Points
        </h2>
        <p class="xircls-modal-description">Select a reward or enter custom points amount to redeem</p>
      </div>

      <div class="xircls-modal-content">
        <div class="xircls-input-section">
          <label class="xircls-label" for="pointsToRedeem">Points amount to redeem</label>
          <input type="number" class="xircls-input" id="pointsToRedeem" placeholder="Enter points amount" min="0" max="${totalPoints}" value="${redemPoints ? redemPoints : ''}">
        </div>

        <div class="xircls-balance-info">
          Your current balance: <span class="xircls-balance-amount">${totalPoints} points</span>
        </div>

        <div id="xircls-error-message" style="display: none;">
          <div class="xircls-error-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert h-4 w-4 mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
            The amount entered exceeds your current balance
          </div>
        </div>

        <div class="xircls-rewards-section">
          <label class="xircls-label">Or select a reward:</label>
          <div class="xircls-rewards-grid">
            <button class="xircls-reward-button" data-value="${halfPoints}">
              <span class="xircls-reward-name">50% Off Next Purchase</span>
              <div class="xircls-reward-badge">${halfPoints}</div>
            </button>
            <button class="xircls-reward-button" data-value="${totalPoints}">
              <span class="xircls-reward-name">100% Off Next Purchase</span>
              <div class="xircls-reward-badge">${totalPoints}</div>
            </button>
          </div>
        </div>
      </div>

      <div class="xircls-modal-footer">
        <button class="xircls-cancel-btn">Cancel</button>
        <button class="xircls-proceed-btn" disabled>Redeem</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const rewardButtons = modal.querySelectorAll(".xircls-reward-button");
  const inputField = modal.querySelector("#pointsToRedeem");
  const proceedBtn = modal.querySelector(".xircls-proceed-btn");
  const cancelBtn = modal.querySelector(".xircls-cancel-btn");
  const errorMessage = modal.querySelector("#xircls-error-message");

  let selectedPoints = 0;

  // Helper function to show/hide error message
  function toggleErrorMessage(show) {
    errorMessage.style.display = show ? "block" : "none";
  }

  // Reward button handlers
  rewardButtons.forEach((btn) => {
    const val = parseInt(btn.dataset.value, 10);
    
    btn.addEventListener("click", () => {
      if (!btn.disabled) {
        selectedPoints = val;
        inputField.value = val;
        proceedBtn.disabled = false;
        toggleErrorMessage(false); // Hide error message
      }
    });
  });

  // Input handler
  inputField.addEventListener("input", () => {
    const val = parseInt(inputField.value, 10);
    if (val > 0 && val <= totalPoints) {
      selectedPoints = val;
      proceedBtn.disabled = false;
      toggleErrorMessage(false); // Hide error message
    } else {
      selectedPoints = 0;
      proceedBtn.disabled = true;
      toggleErrorMessage(val > totalPoints); // Show error if exceeds balance
    }
  });

  // Cancel button
  cancelBtn.addEventListener("click", () => {
    modal.remove();
  });

  // Proceed button
  proceedBtn.addEventListener("click", async () => {
    if (selectedPoints > 0 && selectedPoints <= totalPoints) {
      await handleLoyaltySubmit(selectedPoints);
      modal.remove();
    }
  });
}
async function renderLoyaltyContainer() {
  const loyaltyContainer = document.getElementById('loyaltyContainer');
  if (!loyaltyContainer) {
    return;
  }

  const loyaltyData = (await LoyaltyPoints()) || {};
  const availablePoints = Number(loyaltyData.available_points) || 0;
  console.log(loyaltyData, "loyallllllllllll");
  await fetchAllLoyaltyPointsHistory();

  const loyaltyContent = `
  <div style="position: relative; height: 260px; margin-bottom: 20px; overflow: hidden; border-radius: 5px;">
  <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" alt="Armani Beauty Rewards" style="width: 100%; height: 100%; object-fit: cover;">
  <div style="position: absolute; inset: 0; background: linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4)); display: flex; flex-direction: column; justify-content: center; padding: 0 20px; color: white; text-align: left;">
    <div style="font-family: serif; font-size: 24px; margin-bottom: 10px;">Armani Beauty Rewards</div>
    <div style="font-size: 14px; max-width: 400px;">Earn points with every purchase and enjoy exclusive benefits</div>
  </div>
</div>
<div class="loyalty-main-cards" style="display: flex; gap: 24px; margin-top: 20px; margin-bottom: 20px; text-align: left;">
  <div style="border-radius: 5px; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); width: 100%; display: flex; flex-direction: column;">
    <div style="display: flex; flex-direction: column; padding: 20px; padding-bottom: 10px;">
      <div style="font-weight: 600; tracking-tight; font-family: serif; font-size: 18px;">Your Status</div>
      <div style="font-size: 14px; color: #64748b;">Your current rewards tier and points</div>
    </div>
    <div style="padding: 20px; padding-top: 0; flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
      <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
        <div style="width: 80px; height: 80px; background-color: #fbbf24; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 40px; height: 40px; color: white;">
            <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"></path><circle cx="12" cy="8" r="6"></circle>
          </svg>
        </div>
        <div style="font-family: serif; font-size: 24px; margin-bottom: 5px;">Gold</div>
        <div style="color: #64748b; margin-bottom: 15px;">Member</div>
        <div style="display: flex; align-items: baseline; margin-bottom: 30px;">
        <span style="font-family: serif; font-size: 36px;">${availablePoints}</span>
          <span style="font-size: 14px; color: #64748b; margin-left: 5px;">points</span>
        </div>
        <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; border-radius: 5px; font-size: 14px; font-weight: 500; transition: all 0.2s ease-in-out; height: 40px; padding: 10px 16px; margin-bottom: 30px; background-color: #0ea5e9; color: #fff; border: none; cursor: pointer; outline: none;" onclick="customRedeemModal(${availablePoints});">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
            <rect x="3" y="8" width="18" height="4" rx="1"></rect><path d="M12 8v13"></path><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path>
          </svg>
          Redeem Points
        </button>
        
      </div>
    </div>
  </div>
  <div style="border-radius: 5px; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); width: 100%; display: flex; flex-direction: column;">
    <div style="display: flex; flex-direction: column; padding: 20px; padding-bottom: 10px;">
      <div style="font-weight: 600; tracking-tight; font-family: serif; font-size: 18px;">Your Benefits</div>
      <div style="font-size: 14px; color: #64748b;">Gold tier exclusive perks</div>
    </div>
    <div style="padding: 20px; padding-top: 0; flex-grow: 1;">
      <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 15px;">
        <li style="display: flex; align-items: flex-start;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; color: #0ea5e9; margin-right: 8px; flex-shrink: 0; margin-top: 2px;">
            <path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path>
          </svg>
          <span>All Silver benefits</span>
        </li>
        <li style="display: flex; align-items: flex-start;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; color: #0ea5e9; margin-right: 8px; flex-shrink: 0; margin-top: 2px;">
            <path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path>
          </svg>
          <span>Free express shipping</span>
        </li>
        <li style="display: flex; align-items: flex-start;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; color: #0ea5e9; margin-right: 8px; flex-shrink: 0; margin-top: 2px;">
            <path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path>
          </svg>
          <span>Annual deluxe gift set</span>
        </li>
        <li style="display: flex; align-items: flex-start;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; color: #0ea5e9; margin-right: 8px; flex-shrink: 0; margin-top: 2px;">
            <path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path>
          </svg>
          <span>VIP events invitations</span>
        </li>
        <li style="display: flex; align-items: flex-start;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; color: #0ea5e9; margin-right: 8px; flex-shrink: 0; margin-top: 2px;">
            <path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path>
          </svg>
          <span>Personal beauty consultant</span>
        </li>
      </ul>
      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
        <div style="font-size: 14px; color: #64748b;"><span style="font-weight: 500;">500</span> points earned this year</div>
      </div>
    </div>
  </div>
</div>
<div style="margin-top: 40px;">
  <div style="font-family: serif; font-size: 18px; margin-bottom: 15px; text-align: left;">Loyalty Program Overview</div>
  <div style="width: 100%;">
    <div id="loyaltyTabButtons" style="height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 5px; background-color: #f3f4f6; padding: 5px; color: #64748b; display: grid; grid-template-columns: repeat(3, 1fr);">
      <button id="earnTabButton" class="loyaltyTabButton active" data-tab="earn" style="display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; border-radius: 4px; padding: 8px 12px; font-size: 14px; font-weight: 500; transition: all 0.2s ease-in-out; border: none; cursor: pointer; outline: none; background-color: #fff; color: #0f172a; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); background-color:#fff;">Ways to Earn</button>
      <button id="redeemTabButton" class="loyaltyTabButton" data-tab="redeem" style="display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; border-radius: 4px; padding: 8px 12px; font-size: 14px; font-weight: 500; transition: all 0.2s ease-in-out; border: none; cursor: pointer; outline: none;background-color:#f3f4f6;">Ways to Redeem</button>
      <button id="activityTabButton" class="loyaltyTabButton" data-tab="activity" style="display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; border-radius: 4px; padding: 8px 12px; font-size: 14px; font-weight: 500; transition: all 0.2s ease-in-out; border: none; cursor: pointer; outline: none;background-color:#f3f4f6;">Recent Activity</button>
    </div>
    <div id="loyaltyTabContent" style="margin-top: 15px;">
      ${renderEarnSection()}
    </div>
  </div>
</div>
<div style="margin-top: 40px; text-align: left;">
  <div style="font-family: serif; font-size: 18px; margin-bottom: 15px;">
    Tier Benefits
  </div>
  <div
  class="tier-options-section"
    style="
      display: flex;

      gap: 16px; /*Equivalent to 1rem gap*/
    "
  >
    <div
      style="
        border-radius: 8px; /* Equivalent to 0.5rem */
        border: 1px solid #e2e8f0;
        background-color: #fff;
        color: #0f172a;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
          0 1px 2px 0 rgba(0, 0, 0, 0.06);
        overflow: hidden;
      "
    >
      <div style="background-color: #b45309; height: 10px; width: 100%;display: block;"></div>
      <div style="display: flex; flex-direction: column; padding: 24px; padding-bottom: 16px;">
        <div
          style="
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.025em;
            display: flex;
            align-items: center;
            justify-content: space-between;
          "
        >
          Bronze
        </div>
        <div style="font-size: 14px; color: #71717a;">0-249 points</div>
      </div>
      <div style="padding: 24px; padding-top: 0;">
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">Birthday gift</span>
          </li>
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">Exclusive promotions</span>
          </li>
          <li style="display: flex; align-items: flex-start;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">Product samples with orders</span>
          </li>
        </ul>
      </div>
    </div>
    <div
      style="
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        background-color: #fff;
        color: #0f172a;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
          0 1px 2px 0 rgba(0, 0, 0, 0.06);
        overflow: hidden;
      "
    >
      <div style="background-color: #9ca3af; height: 10px; width: 100%;display: block;"></div>
      <div style="display: flex; flex-direction: column; padding: 24px; padding-bottom: 16px;">
        <div
          style="
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.025em;
            display: flex;
            align-items: center;
            justify-content: space-between;
          "
        >
          Silver
        </div>
        <div style="font-size: 14px; color: #71717a;">250-499 points</div>
      </div>
      <div style="padding: 24px; padding-top: 0;">
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">All Bronze benefits</span>
          </li>
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">Free standard shipping</span>
          </li>
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">Early access to new product launches</span>
          </li>
          <li style="display: flex; align-items: flex-start;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">Double points days</span>
          </li>
        </ul>
      </div>
    </div>
    <div
      style="
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        background-color: #fff;
        color: #0f172a;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
          0 1px 2px 0 rgba(0, 0, 0, 0.06);
        overflow: hidden;
        border: 2px solid #3b82f6;
      "
    >
      <div style="background-color: #f59e0b; height: 10px; width: 100%; display: block;"></div>
      <div style="display: flex; flex-direction: column; padding: 24px; padding-bottom: 16px;">
        <div
          style="
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.025em;
            display: flex;
            align-items: center;
            justify-content: space-between;
          "
        >
          Gold
          <div
            style="
              display: inline-flex;
              align-items: center;
              border-radius: 9999px;
              border: 1px solid #e2e8f0;
              padding: 3px 10px;
              font-size: 12px;
              font-weight: 600;
            "
          >
            Current
          </div>
        </div>
        <div style="font-size: 14px; color: #71717a;">500-999 points</div>
      </div>
      <div style="padding: 24px; padding-top: 0;">
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">All Silver benefits</span>
          </li>
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">Free express shipping</span>
          </li>
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">Annual deluxe gift set</span>
          </li>
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">VIP events invitations</span>
          </li>
          <li style="display: flex; align-items: flex-start;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">Personal beauty consultant</span>
          </li>
        </ul>
      </div>
    </div>
    <div
      style="
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        background-color: #fff;
        color: #0f172a;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
          0 1px 2px 0 rgba(0, 0, 0, 0.06);
        overflow: hidden;
      "
    >
      <div style="background-color: #7c3aed; height: 10px; width: 100%; display: block;"></div>
      <div style="display: flex; flex-direction: column; padding: 24px; padding-bottom: 16px;">
        <div
          style="
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.025em;
            display: flex;
            align-items: center;
            justify-content: space-between;
          "
        >
          Platinum
        </div>
        <div style="font-size: 14px; color: #71717a;">1000+ points</div>
      </div>
      <div style="padding: 24px; padding-top: 0;">
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">All Gold benefits</span>
          </li>
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">Complimentary beauty services</span>
          </li>
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">Dedicated concierge</span>
          </li>
          <li style="display: flex; align-items: flex-start; margin-bottom: 8px;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">Limited edition products</span>
          </li>
          <li style="display: flex; align-items: flex-start;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="width: 16px; height: 16px; color: #3b82f6; margin-right: 8px; margin-top: 2px;"
            >
              <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
              <path d="m9 11 3 3L22 4"></path>
            </svg>
            <span style="font-size: 14px;">Exclusive brand experiences</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</div></div>

<div style="margin-top: 40px; text-align: left;"> <div style="font-size: 18px; margin-bottom: 15px; ">
Frequently Asked Questions
</div> 
<div style="width: 100%;"> ${renderFAQItems()} </div> 
</div>
  `;

  loyaltyContainer.innerHTML = loyaltyContent;

  // Add event listeners to tab buttons
  const tabButtons = document.querySelectorAll('.loyaltyTabButton');
  
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', handleTabClick);
  });


  // Add event listeners to FAQ buttons
  const faqButtons = document.querySelectorAll('.faqButton');
  faqButtons.forEach(button => {
    button.addEventListener('click', toggleFAQ);
  });
}

function toggleFAQ(event) {
  const button = event.target;
  const item = button.closest('.faqItem');
  const content = item.querySelector('.faqContent');
  const isOpen = item.classList.contains('open');

  if (isOpen) {
    item.classList.remove('open');
    content.style.display = 'none';
    button.querySelector('.faq-arrow-svg').style.transform = 'rotate(0deg)'; // Reset arrow
  } else {
    item.classList.add('open');
    content.style.display = 'block';
    button.querySelector('.faq-arrow-svg').style.transform = 'rotate(180deg)'; // Rotate arrow
  }
}

function renderFAQItems() {
  const faqData = [
    {
      question: 'How do I earn Armani Beauty Rewards points?',
      answer: 'You earn points by making purchases, leaving reviews, referring friends, and celebrating your birthday. 1 point is earned for every $1 spent on purchases.',
    },
    {
      question: 'When do my points expire?',
      answer: 'Points expire 12 months after they are earned if not redeemed.',
    },
    {
      question: 'How do I redeem my points?',
      answer: `You can redeem your points for rewards by clicking the 'Redeem Points' button on your account page and selecting from available rewards.`,
    },
    {
      question: 'How do I achieve the next tier level?',
      answer: 'Tier levels are based on points earned in a calendar year. Bronze starts at 0 points, Silver at 250, Gold at 500, and Platinum at 1000 points.',
    },
    {
      question: 'Do my tier benefits reset?',
      answer: `Your tier status is evaluated at the end of each calendar year. If you maintain the required points threshold, you'll keep your status for the next year.`,
    },
  ];

  let faqItemsHTML = '';
  faqData.forEach(faq => {
    faqItemsHTML += `
      <div class="faqItem" style="border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex;">
          <button class="faqButton" style="display: flex; flex: 1; align-items: center; justify-content: space-between; padding: 15px 0; font-weight: 500; transition: all 0.2s ease-in-out; text-align: left; border: none; background: none; cursor: pointer; outline: none;">
            <div style="display: flex; align-items: center;font-weight: bold;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-help" style="width: 16px; height: 16px; color: #0ea5e9; margin-right: 8px;">
                <circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path>
              </svg>
              ${faq.question}
            </div>
            <svg class="faq-arrow-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down" style="width: 16px; height: 16px; transition: transform 0.2s ease-in-out;">
              <path d="m6 9 6 6 6-6"></path>
            </svg>
          </button>
        </div>
        <div class="faqContent" style="padding: 0 15px 15px; font-size: 14px; color: #64748b; display: none;">
          ${faq.answer}
        </div>
      </div>
    `;
  });

  return faqItemsHTML;
}


async function handleTabClick(event) {
  const tab = event.target.dataset.tab;
  console.log('-------------');
  // Deactivate all buttons
  const tabButtons = document.querySelectorAll('.loyaltyTabButton');
  tabButtons.forEach(button => {
    button.classList.remove('active');
    button.style.backgroundColor = '#f3f4f6';
    button.style.color = '';
    button.style.boxShadow = '';
  });

  // Activate the clicked button
  event.target.classList.add('active');
  event.target.style.backgroundColor = '#fff';
  event.target.style.color = '#0f172a';
  event.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';

  // Render the appropriate content
  let content = '';
  switch (tab) {
    case 'earn':
      content = renderEarnSection();
      break;
    case 'redeem':
      content = await renderRedeemSection();
      break;
    case 'activity':
      content = renderActivitySection();
      break;
    default:
      content = '';
  }

  document.getElementById('loyaltyTabContent').innerHTML = content;
}

function renderEarnSection() {
  return `
    <div class="earn-section-tab" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; text-align: left;">
      <div style="border-radius: 5px; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); display: flex;">
        <div style="display: flex; align-items: center; padding: 15px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background-color: rgba(14, 165, 233, 0.1); display: flex; align-items: center; justify-content: center; margin-right: 15px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <div>
            <div style="font-weight: 500;">Make a Purchase</div>
            <div style="font-size: 14px; color: #64748b;">Earn 1 point for every Rs. 1 spent</div>
          </div>
        </div>
      </div>
      <div style="border-radius: 5px; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); display: flex;">
        <div style="display: flex; align-items: center; padding: 15px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background-color: rgba(14, 165, 233, 0.1); display: flex; align-items: center; justify-content: center; margin-right: 15px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
              <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle>
            </svg>
          </div>
          <div>
            <div style="font-weight: 500;">Leave a Review</div>
            <div style="font-size: 14px; color: #64748b;">50 points for each verified product review</div>
          </div>
        </div>
      </div>
      <div style="border-radius: 5px; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); display: flex;">
        <div style="display: flex; align-items: center; padding: 15px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background-color: rgba(14, 165, 233, 0.1); display: flex; align-items: center; justify-content: center; margin-right: 15px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
              <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div>
            <div style="font-weight: 500;">Refer a Friend</div>
            <div style="font-size: 14px; color: #64748b;">100 points when your friend makes their first purchase</div>
          </div>
        </div>
      </div>
      <div style="border-radius: 5px; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); display: flex;">
        <div style="display: flex; align-items: center; padding: 15px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background-color: rgba(14, 165, 233, 0.1); display: flex; align-items: center; justify-content: center; margin-right: 15px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
              <rect x="3" y="8" width="18" height="4" rx="1"></rect><path d="M12 8v13"></path><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path>
            </svg>
          </div>
          <div>
            <div style="font-weight: 500;">Birthday Bonus</div>
            <div style="font-size: 14px; color: #64748b;">250 points during your birthday month</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function renderRedeemSection() {
  const loyaltyData = (await LoyaltyPoints()) || {};
  const availablePoints = Number(loyaltyData.available_points) || 0;
  const halfPoints = availablePoints * 50 / 100;
  // return `
  //   <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
  //     <div style="border-radius: 5px; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);">
  //       <div style="padding: 15px; text-align: left;">
  //         <div style="display: flex; align-items: center; margin-bottom: 10px;">
  //           <div style="margin-right: 12px; width: 56px; height: 56px; background-color: #f3f4f6; border-radius: 5px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
  //             <img src="https://images.unsplash.com/photo-1631214528005-0e39d45d1a33?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="$10 Off Next Purchase" style="object-fit: cover; width: 100%; height: 100%;">
  //           </div>
  //           <div>
  //             <div style="font-weight: 500;">$10 Off Next Purchase</div>
  //             <div style="display: inline-flex; align-items: center; border-radius: 50px; border: 1px solid #e2e8f0; padding: 3px 10px; font-size: 12px; font-weight: 500; color: #0f172a; margin-top: 4px;">200 points</div>
  //           </div>
  //         </div>
  //         <div style="font-size: 14px; color: #64748b; margin-bottom: 10px;">Get $10 off your next order</div>
  //         <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: all 0.2s ease-in-out; background-color: #0ea5e9; color: #fff; border: none; cursor: pointer; outline: none; height: 36px; border-radius: 5px; padding: 0 12px; width: 100%;" onclick="customRedeemModal(${loyaltyData.available_points})">Redeem</button>
  //       </div>
  //     </div>
  //     <div style="border-radius: 5px; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);">
  //       <div style="padding: 15px; text-align: left;">
  //         <div style="display: flex; align-items: center; margin-bottom: 10px;">
  //           <div style="margin-right: 12px; width: 56px; height: 56px; background-color: #f3f4f6; border-radius: 5px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
  //             <img src="https://images.unsplash.com/photo-1617897903246-719242758050?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Free Standard Shipping" style="object-fit: cover; width: 100%; height: 100%;">
  //           </div>
  //           <div>
  //             <div style="font-weight: 500;">Free Standard Shipping</div>
  //             <div style="display: inline-flex; align-items: center; border-radius: 50px; border: 1px solid #e2e8f0; padding: 3px 10px; font-size: 12px; font-weight: 500; color: #0f172a; margin-top: 4px;">300 points</div>
  //           </div>
  //         </div>
  //         <div style="font-size: 14px; color: #64748b; margin-bottom: 10px;">Free standard shipping on your next order</div>
  //         <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: all 0.2s ease-in-out; background-color: #0ea5e9; color: #fff; border: none; cursor: pointer; outline: none; height: 36px; border-radius: 5px; padding: 0 12px; width: 100%;" onclick="customRedeemModal(${loyaltyData.available_points})">Redeem</button>
  //       </div>
  //     </div>
  //     <div style="border-radius: 5px; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);">
  //       <div style="padding: 15px; text-align: left;">
  //         <div style="display: flex; align-items: center; margin-bottom: 10px;">
  //           <div style="margin-right: 12px; width: 56px; height: 56px; background-color: #f3f4f6; border-radius: 5px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
  //             <img src="https://images.unsplash.com/photo-1594125311687-3b1b3eafa9f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Deluxe Sample Set" style="object-fit: cover; width: 100%; height: 100%;">
  //           </div>
  //           <div>
  //             <div style="font-weight: 500;">Deluxe Sample Set</div>
  //             <div style="display: inline-flex; align-items: center; border-radius: 50px; border: 1px solid #e2e8f0; padding: 3px 10px; font-size: 12px; font-weight: 500; color: #0f172a; margin-top: 4px;">400 points</div>
  //           </div>
  //         </div>
  //         <div style="font-size: 14px; color: #64748b; margin-bottom: 10px;">Receive a set of deluxe samples with your next purchase</div>
  //         <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: all 0.2s ease-in-out; background-color: #0ea5e9; color: #fff; border: none; cursor: pointer; outline: none; height: 36px; border-radius: 5px; padding: 0 12px; width: 100%;" onclick="customRedeemModal(${loyaltyData.available_points})">Redeem</button>
  //       </div>
  //     </div>
  //     <div style="border-radius: 5px; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);">
  //       <div style="padding: 15px; text-align: left;">
  //         <div style="display: flex; align-items: center; margin-bottom: 10px;">
  //           <div style="margin-right: 12px; width: 56px; height: 56px; background-color: #f3f4f6; border-radius: 5px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
  //             <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Travel-Size Armani Fragrance" style="object-fit: cover; width: 100%; height: 100%;">
  //           </div>
  //           <div>
  //             <div style="font-weight: 500;">Travel-Size Armani Fragrance</div>
  //             <div style="display: inline-flex; align-items: center; border-radius: 50px; border: 1px solid #e2e8f0; padding: 3px 10px; font-size: 12px; font-weight: 500; color: #0f172a; margin-top: 4px;">800 points</div>
  //           </div>
  //         </div>
  //         <div style="font-size: 14px; color: #64748b; margin-bottom: 10px;">Choose one travel-size fragrance</div>
  //         <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: all 0.2s ease-in-out; border: none; cursor: pointer; outline: none; height: 36px; border-radius: 5px; padding: 0 12px; width: 100%; background-color: #94a3b8; color: #fff;" ${loyaltyData.available_points < 800 ? 'disabled' : ''} onclick="customRedeemModal(${loyaltyData.available_points})">Not Enough Points</button>
  //       </div>
  //     </div>
  //   </div>
  // `;
  return `
    <div class="redeem-section-tab" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
      <div style="border-radius: 5px; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);">
        <div style="padding: 15px; text-align: left;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
      
            <div>
              <div style="font-weight: 500;">50% Off Next Purchase</div>
              <div style="display: inline-flex; align-items: center; border-radius: 50px; border: 1px solid #e2e8f0; padding: 3px 10px; font-size: 12px; font-weight: 500; color: #0f172a; margin-top: 4px;">${halfPoints} points</div>
            </div>
          </div>
          <div style="font-size: 14px; color: #64748b; margin-bottom: 10px;">Get 50% off your next order</div>
          <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: all 0.2s ease-in-out; background-color: #0ea5e9; color: #fff; border: none; cursor: pointer; outline: none; height: 36px; border-radius: 5px; padding: 0 12px; width: 100%;" onclick="customRedeemModal(${availablePoints}, ${halfPoints})">Redeem</button>
        </div>
      </div>
      <div style="border-radius: 5px; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);">
        <div style="padding: 15px; text-align: left;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            
            <div>
              <div style="font-weight: 500;">100% Off Next Purchase</div>
               <div style="display: inline-flex; align-items: center; border-radius: 50px; border: 1px solid #e2e8f0; padding: 3px 10px; font-size: 12px; font-weight: 500; color: #0f172a; margin-top: 4px;">${availablePoints} points</div>
            </div>
          </div>
          <div style="font-size: 14px; color: #64748b; margin-bottom: 10px;">Get 100% off your next order</div>
          <button style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; font-size: 14px; font-weight: 500; transition: all 0.2s ease-in-out; background-color: #0ea5e9; color: #fff; border: none; cursor: pointer; outline: none; height: 36px; border-radius: 5px; padding: 0 12px; width: 100%;" onclick="customRedeemModal(${availablePoints}, ${availablePoints})">Redeem</button>
        </div>
      </div>
    </div>
  `;
}

const activityData = [
  { type: 'Purchase', order: '#ARM-8723', date: 'Mar 15, 2025', points: 150 },
  { type: 'Purchase', order: '#ARM-8615', date: 'Feb 28, 2025', points: 100 },
  { type: 'Birthday Bonus', date: 'Jan 10, 2025', points: 250 },
  { type: 'Account Registration', date: 'Dec 15, 2024', points: 250 },
  { type: 'Review', date: 'Nov 5, 2024', points: 50 },
  { type: 'Referral', date: 'Oct 20, 2024', points: 100 },
  { type: 'Purchase', order: '#ARM-8500', date: 'Sep 10, 2024', points: 120 },
  { type: 'Purchase', order: '#ARM-8422', date: 'Aug 1, 2024', points: 80 },
  { type: 'Review', date: 'Jul 15, 2024', points: 50 },
  { type: 'Account Update', date: 'Jun 2, 2024', points: 20 },
  { type: 'Purchase', order: '#ARM-8300', date: 'May 18, 2024', points: 110 },
  { type: 'Referral', date: 'Apr 5, 2024', points: 100 },
  { type: 'Purchase', order: '#ARM-8211', date: 'Mar 22, 2024', points: 90 },
  { type: 'Review', date: 'Feb 10, 2024', points: 50 },
  { type: 'Account Registration', date: 'Jan 1, 2024', points: 250 },
];

const pageSize = 3; // Number of items per page
let currentPage = 1;

function renderActivitySection() {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = allLoyaltyPointsHistory.slice(startIndex, endIndex);

  let activityItemsHTML = '';
  paginatedData.forEach(activity => {
    const points = activity.action === "DEBIT" ? `-${activity.redeemed}` : activity.earned;

    activityItemsHTML += `
      <div style="border-bottom: 1px solid #e5e7eb;">
        <div style="padding: 15px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; color: #0ea5e9; margin-right: 12px;">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <div>
              <div style="font-size: 14px; font-weight: 500; text-align: left;">${activity.description}</div>
              <div style="font-size: 12px; color: #64748b; text-align: left;">${activity.created_at}</div>
            </div>
          </div>
          <div style="font-weight: 500; color: #0ea5e9;">${points}</div>
        </div>
      </div>
    `;
  });

  const totalPages = Math.ceil(allLoyaltyPointsHistory.length / pageSize);
  const paginationHTML = renderPagination(totalPages);

  return `
    <div style="border-radius: 5px; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);">
      <div style="padding: 0;">
        ${activityItemsHTML}
      </div>
      <div style="display: flex; align-items: center; justify-content: center; padding: 15px; border-top: 1px solid #e5e7eb;">
        ${paginationHTML}
      </div>
    </div>
  `;
}



function renderPagination(totalPages) {
  let paginationHTML = '';

  // Previous Button
  paginationHTML += `
    <button 
      style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; border-radius: 5px; font-size: 14px; font-weight: 500; transition: all 0.2s ease-in-out; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; cursor: pointer; outline: none; padding: 10px 16px;"
      onclick="goToPage(${currentPage - 1})" 
      ${currentPage === 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
      Previous
    </button>
  `;

  // Next Button
  paginationHTML += `
    <button 
      style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; border-radius: 5px; font-size: 14px; font-weight: 500; transition: all 0.2s ease-in-out; border: 1px solid #e2e8f0; background-color: #fff; color: #0f172a; cursor: pointer; outline: none; padding: 10px 16px;"
      onclick="goToPage(${currentPage + 1})"
      ${currentPage === totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
      Next
    </button>
  `;

  return paginationHTML;
}

function goToPage(page) {
  currentPage = page;
  document.getElementById('loyaltyTabContent').innerHTML = renderActivitySection(); // Re-render the activity section
}


updateProfileImage(img_url, img_fn, img_ln);
if (window.innerWidth <= 768) {
  renderMobileMenu();
} else {
  renderMenu();
}
// renderMenu();
renderProfileContainer(cardData);
// renderWishlist();
renderOrders(customerOrders);
// renderRecentlyViewed();
renderSecurityContainer();
renderDashboard(customerOrders);
renderArmaniLoyaltyContainer();

function renderArmaniLoyaltyContainer() {
  const loyaltyContainer = document.getElementById("loyaltyContainer");
  if (!loyaltyContainer) return;
  loyaltyContainer.innerHTML = renderArmaniLoyaltyUI();
}


function renderArmaniLoyaltyUI(data = {}) {
  const {
    tier = "Gold",
    points = 750,
    pointsToNextTier = 250,
    earnedThisYear = 500,
    expiringPoints = 450,
    expiringInDays = 30,
  } = data;

  return `
      <div style="background:#ffffff; padding:32px; margin-bottom:32px;  text-align:left;">

        <!-- Page Title -->
        <div style="font-size:22px; font-family:serif; margin-bottom:24px;  text-align:left;">
          Loyalty Points
        </div>

        <!-- Banner -->
        <div style="position:relative; height:260px; margin-bottom:32px; overflow:hidden; border-radius:6px;">
          <img
            src="https://res.cloudinary.com/demo/image/upload/w_1200,h_400,c_fill,g_center/samples/landscapes/landscape-panorama.jpg"
            style="width:100%; height:100%; object-fit:cover;"
          />

          <div style="
            position:absolute;
            inset:0;
            background:linear-gradient(...);
            display:flex;
            flex-direction:column;
            justify-content:center;
            padding:32px;
            color:#ffffff;
            text-align:left;
          ">

            <div style="font-size:26px; font-family:serif; margin-bottom:6px;">
              Armani Beauty Rewards
            </div>
            <div style="font-size:13px; max-width:420px;">
              Earn points with every purchase and enjoy exclusive benefits
            </div>
          </div>
        </div>

        <!-- Content Wrapper -->
        <div style="max-width:900px; margin:0 auto; text-align:left;">

          <!-- Your Status Card -->
          <div style="border:1px solid #e5e5e5; border-radius:6px; margin-bottom:24px; text-align:left;">

            <div style="padding:20px; border-bottom:1px solid #e5e5e5;">
              <div style="font-size:18px; font-family:serif;">
                Your Status
              </div>
              <div style="font-size:12px; color:#777777; margin-top:4px;">
                Your current rewards tier and points
              </div>
            </div>

            <div style="padding:24px; display:flex; justify-content:space-between; align-items:center;">

              <div style="display:flex; align-items:center;">
                <div style="
                  width:72px;
                  height:72px;
                  border-radius:50%;
                  background:#f5b400;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  margin-right:20px;
                  color:#ffffff;
                  font-size:28px;
                ">
                  🏅
                </div>

                <div>
                  <div style="font-size:24px; font-family:serif;">
                    Gold
                  </div>
                  <div style="font-size:12px; color:#777777;">
                    Member
                  </div>
                </div>
              </div>

              <div style="text-align:right;">
                <div style="font-size:26px; font-family:serif;">
                  750
                  <span style="font-size:12px; color:#777777;">points</span>
                </div>

                <div style="
                  margin-top:10px;
                  background:#000000;
                  color:#ffffff;
                  padding:8px 14px;
                  font-size:12px;
                  display:inline-block;
                  cursor:pointer;
                ">
                  Redeem Points
                </div>
              </div>
            </div>

            <!-- Progress -->
            <div style="padding:0 24px 24px 24px;">
              <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
                <div>Gold</div>
                <div>Platinum</div>
              </div>

              <div style="height:6px; background:#eeeeee !important; border-radius:4px; overflow:hidden;">
                <div style="width:70%; height:100%; background-color:#9b0000; display:block;"></div>
              </div>

              <div style="font-size:11px; color:#777777; text-align:center; margin-top:6px;">
                250 more points to reach Platinum tier
              </div>
            </div>
          </div>

          <!-- Your Benefits -->
          <div style="border:1px solid #e5e5e5; border-radius:6px; margin-bottom:24px; text-align:left;">

            <div style="padding:20px; border-bottom:1px solid #e5e5e5;">
              <div style="font-size:18px; font-family:serif;">
                Your Benefits
              </div>
              <div style="font-size:12px; color:#777777; margin-top:4px;">
                Gold tier exclusive perks
              </div>
            </div>

            <div style="padding:24px; display:grid; grid-template-columns:1fr 1fr; gap:14px; font-size:13px; text-align:left;">

              <div>✔ All Silver benefits</div>
              <div>✔ Free express shipping</div>
              <div>✔ Annual deluxe gift set</div>
              <div>✔ VIP events invitations</div>
              <div>✔ Personal beauty consultant</div>

            </div>

            <div style="
              padding:14px 24px;
              border-top:1px solid #eeeeee;
              display:flex;
              justify-content:space-between;
              font-size:11px;
            ">
              <div style="color:#777777;">
                500 points earned this year
              </div>
              <div style="color:#cc0000;">
                450 <span style="color:#000000;">points expiring in 30 days</span>
              </div>
            </div>
          </div>

          <!-- Section Wrapper -->
          <div style="margin-top:48px;">

            <!-- Title OUTSIDE container -->
            <div style="text-align:center; font-size:22px; font-family:serif; margin-bottom:40px;">
              Tier Benefits
            </div>

            <!-- Container -->
            <div style="border:1px solid #e5e5e5; padding:32px; background:#ffffff; text-align:left; z-index:1;">

              <!-- Subtitle -->
              <div style="text-align:center; font-size:12px; color:#777777; margin-bottom:32px;">
                Experience exclusive perks and privileges as you progress through our membership tiers.
              </div>

              <!-- Timeline -->
              <!-- Timeline -->
              <div
                style="
                  position:relative;
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                  margin-bottom:36px;
                "
              >
                <!-- Line -->
                <div
                  style="
                    position:absolute;
                    top:50%;
                    left:0;
                    right:0;
                    height:1px;
                    background-color:#e5e5e5;
                    transform:translateY(-50%);
                    pointer-events:none;
                  "
                ></div>

                <!-- Step 1 -->
                <div style="text-align:center; position:relative; background:#fff;">
                  <div style="width:24px;height:24px;border-radius:50%;border:1px solid #ccc;display:flex;align-items:center;justify-content:center;font-size:11px;margin:0 auto;">
                    1
                  </div>
                  <div style="font-size:11px;margin-top:6px;">Bronze</div>
                </div>

                <!-- Step 2 -->
                <div style="text-align:center; position:relative; background:#fff;">
                  <div style="width:24px;height:24px;border-radius:50%;border:1px solid #ccc;display:flex;align-items:center;justify-content:center;font-size:11px;margin:0 auto;">
                    2
                  </div>
                  <div style="font-size:11px;margin-top:6px;">Silver</div>
                </div>

                <!-- Step 3 -->
                <div style="text-align:center; position:relative; background:#fff;">
                  <div style="width:24px;height:24px;border-radius:50%;border:1px solid #000;display:flex;align-items:center;justify-content:center;font-size:11px;margin:0 auto;">
                    3
                  </div>
                  <div style="font-size:11px;margin-top:6px;">Gold</div>
                  <div style="font-size:10px;">Current</div>
                </div>

                <!-- Step 4 -->
                <div style="text-align:center; position:relative; background:#fff;">
                  <div style="width:24px;height:24px;border-radius:50%;border:1px solid #ccc;display:flex;align-items:center;justify-content:center;font-size:11px;margin:0 auto;">
                    4
                  </div>
                  <div style="font-size:11px;margin-top:6px;">Platinum</div>
                </div>
              </div>


              <!-- Cards -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">

                <div style="border:1px solid #eee;padding:20px;">
                  <div style="font-family:serif;font-size:15px;margin-bottom:8px;">Bronze</div>
                  <div style="font-size:13px;">✔ Birthday gift</div>
                  <div style="font-size:13px;">✔ Exclusive promotions</div>
                  <div style="font-size:13px;">✔ Product samples with orders</div>
                </div>

                <div style="border:1px solid #eee;padding:20px;">
                  <div style="font-family:serif;font-size:15px;margin-bottom:8px;">Silver</div>
                  <div style="font-size:13px;">✔ All Bronze benefits</div>
                  <div style="font-size:13px;">✔ Free standard shipping</div>
                  <div style="font-size:13px;">✔ Early access to new launches</div>
                  <div style="font-size:13px;">✔ Double points days</div>
                </div>

                <div style="border:1.5px solid #000;padding:20px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div style="font-family:serif;font-size:15px;">Gold</div>
                    <div style="font-size:10px;border:1px solid #000;padding:2px 6px;">Current</div>
                  </div>
                  <div style="font-size:13px;">✔ All Silver benefits</div>
                  <div style="font-size:13px;">✔ Free express shipping</div>
                  <div style="font-size:13px;">✔ Annual deluxe gift set</div>
                  <div style="font-size:13px;">✔ VIP events invitations</div>
                  <div style="font-size:13px;">✔ Personal beauty consultant</div>
                </div>

                <div style="border:1px solid #eee;padding:20px;">
                  <div style="font-family:serif;font-size:15px;margin-bottom:8px;">Platinum</div>
                  <div style="font-size:13px;">✔ All Gold benefits</div>
                  <div style="font-size:13px;">✔ Complimentary beauty services</div>
                  <div style="font-size:13px;">✔ Dedicated concierge</div>
                  <div style="font-size:13px;">✔ Limited edition products</div>
                  <div style="font-size:13px;">✔ Exclusive brand experiences</div>
                </div>

              </div>

            </div>
          </div>


          <!-- Ways to Earn -->
          <div style="margin-top:32px;">
            <div style="font-size:18px; font-family:serif; margin-bottom:16px; text-align:left;">
              Ways to Earn
            </div>

            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:16px;">

              <div style="border:1px solid #e5e5e5; padding:20px; text-align:center;">
                <div style="margin-bottom:8px;">🛍</div>
                <div style="font-size:13px;">Make a Purchase</div>
                <div style="font-size:11px; color:#777777;">Earn 1 point for every $1 spent</div>
              </div>

              <div style="border:1px solid #e5e5e5; padding:20px; text-align:center;">
                <div style="margin-bottom:8px;">⭐</div>
                <div style="font-size:13px;">Leave a Review</div>
                <div style="font-size:11px; color:#777777;">50 points per review</div>
              </div>

              <div style="border:1px solid #e5e5e5; padding:20px; text-align:center;">
                <div style="margin-bottom:8px;">🎁</div>
                <div style="font-size:13px;">Refer a Friend</div>
                <div style="font-size:11px; color:#777777;">100 points on first purchase</div>
              </div>

              <div style="border:1px solid #e5e5e5; padding:20px; text-align:center;">
                <div style="margin-bottom:8px;">🎂</div>
                <div style="font-size:13px;">Birthday Bonus</div>
                <div style="font-size:11px; color:#777777;">250 points during birthday month</div>
              </div>

            </div>
          </div>

        </div>
      </div>

`;
}


// const SUPPORT_TICKET_BASE_URL = "http://127.0.0.1:8000";
// const supportTicketApi = {
//   baseUrl: SUPPORT_TICKET_BASE_URL,
//   ticketsPath: "/api/v1/shopify/handler/shop",
// };

// const supportTicketState = {
//   tickets: [],
// };

function getSupportTicketApi() {
  const baseUrl =
    globalThis.SUPPORT_TICKET_BASE_URL ||
    globalThis.supportTicketApi?.baseUrl ||
    "http://127.0.0.1:8000";

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    ticketsPath: "/api/v1/shopify/handler/shop",
  };
}

window.supportTicketState = window.supportTicketState || {
  tickets: [],
};

function ensureSupportTicketsContainer() {
  let container = document.getElementById("supportTicketsContainer");
  const tabContent = document.getElementById("tabContent");

  if (!container) {
    container = document.createElement("div");
    container.id = "supportTicketsContainer";
    if (tabContent) {
      tabContent.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
  }

  if (!container.dataset.rendered) {
    renderSupportTickets(container);
    container.dataset.rendered = "true";
    fetchAndRenderSupportTickets();
  }

  container.style.display = "block";
  return container;
}

function renderSupportTickets(container) {
  container.innerHTML = `
  <div style="max-width:1200px;margin:0 auto;padding:24px;position:relative;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;gap:12px;flex-wrap:wrap;">
      <div>
        <h1 style="font-size:28px;font-weight:700;margin:0 0 6px;">My Support Tickets</h1>
        <p style="color:#6b7280;margin:0;">Track and manage your support requests</p>
      </div>

      <button id="openCreateTicket" style="
        background:#2563eb;color:#fff;border:none;border-radius:6px;
        padding:10px 16px;font-size:14px;font-weight:500;cursor:pointer;
      ">+ Create New Ticket</button>
    </div>

    <div id="supportTicketStats" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
      ${renderSupportStats([])}
    </div>

    <div style="display:flex;gap:12px;margin-bottom:24px;position:relative;flex-wrap:wrap;">
      <input id="supportTicketSearch" placeholder="Search tickets by subject, number, or description..."
        style="flex:1;min-width:240px;padding:10px 12px;border-radius:6px;border:1px solid #d1d5db;font-size:14px;"
      />

      ${dropdown("statusDropdown", "All Status", ["All Status","Open","In Progress","Waiting Response","Resolved","Closed"])}
      ${dropdown("priorityDropdown", "All Priority", ["All Priority","Low","Medium","High","Urgent"])}
    </div>

    <div id="supportTicketList" style="display:flex;flex-direction:column;gap:16px;"></div>

    ${createTicketModal()}
    ${ticketConversationModal()}

    <p id="supportTicketEmptyState" style="display:none;color:#6b7280;text-align:center;margin:12px 0 0;">No tickets found for your search/filter.</p>
  </div>
  `;

  attachDropdownLogic();
  attachModalLogic();
  attachSupportTicketsLogic();
  attachTicketConversationModalLogic();
  renderSupportTicketList();
}

function formatSupportTicketDate(value) {
  if (!value) return "-";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return String(value);

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeSupportTicket(ticket = {}) {
  const id = ticket?.id || ticket?.ticket_id || ticket?.ticket_number || "";
  const ticketNumber = ticket?.ticket_number || ticket?.ticket_id || (id ? `TKT-${id}` : "-");
  const subject = ticket?.content?.subject || ticket?.subject || "Untitled Ticket";
  const description = ticket?.content?.description || ticket?.description || "No description provided.";
  const tag = ticket?.additional_details?.department || ticket?.department || "General Enquiry";
  const priorityRaw = ticket?.additional_details?.priority || ticket?.priority || "medium";
  const statusRaw = ticket?.status || "open";
  const relatedOrder = ticket?.additional_details?.order_number || ticket?.order_number || ticket?.order_id || "";
  const assignedTo = ticket?.assigned_to?.name || ticket?.agent_name || "";

  const metaParts = [ticketNumber];
  if (relatedOrder) metaParts.push(`Order: ${relatedOrder}`);
  if (assignedTo) metaParts.push(`Agent: ${assignedTo}`);

  const normalizeDisplay = (val = "") => String(val)
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    id,
    title: subject,
    tag: normalizeDisplay(tag),
    desc: description,
    status: normalizeDisplay(statusRaw),
    priority: normalizeDisplay(priorityRaw),
    meta: metaParts.join(" · "),
    date: formatSupportTicketDate(ticket?.created_at || ticket?.createdAt || ticket?.date),
  };
}

function renderSupportStats(tickets = []) {
  const counts = {
    open: 0,
    inProgress: 0,
    awaiting: 0,
    resolved: 0,
  };

  tickets.forEach((ticket) => {
    const status = (ticket?.status || "").toLowerCase().trim();

    if (status === "open") {
      counts.open += 1;
    } else if (status === "pending" || status === "in progress") {
      counts.inProgress += 1;
    } else if (status === "assigned") {
      counts.awaiting += 1;
    } else if (status === "closed" || status === "resolved") {
      counts.resolved += 1;
    }
  });

  return [
    statCard("Open Tickets", counts.open),
    statCard("In Progress", counts.inProgress),
    statCard("Awaiting Response", counts.awaiting),
    statCard("Resolved", counts.resolved),
  ].join("");
}

function renderSupportTicketList() {
  const ticketList = document.getElementById("supportTicketList");
  const stats = document.getElementById("supportTicketStats");

  if (!ticketList) return;

  const tickets = window.supportTicketState?.tickets || [];

  const normalizedTickets = tickets.map((ticket) =>
    normalizeSupportTicket(ticket)
  );

  ticketList.innerHTML = normalizedTickets
    .map((ticket) => ticketCard(ticket))
    .join("");

  if (stats) {
    stats.innerHTML = renderSupportStats(tickets);
  }

  attachCloseTicketLogic(); // 👈 ADD THIS

  if (typeof applySupportFilters === "function") {
    applySupportFilters();
  }
}

function fetchAndRenderSupportTickets() {
  const { web_url, customer_id, email } = getSupportTicketRequestContext();
  const query = new URLSearchParams({ web_url, customer_id, email }).toString();

  const { ticketsPath } = getSupportTicketApi();

  fetch(`${getSupportApiUrl(ticketsPath)}?${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
    .then(parseSupportApiResponse)
    .then(({ ok, data }) => {
      if (!ok || data?.status !== "success") {
        throw new Error(data?.message || "Failed to fetch support tickets");
      }

      //window.supportTicketState.tickets = Array.isArray(data?.data?.tickets) ? data.data.tickets : [];
      if (!window.supportTicketState) {
        window.supportTicketState = { tickets: [] };
      }
      
      window.supportTicketState.tickets =
        Array.isArray(data?.data?.tickets)
          ? data.data.tickets
          : [];
      renderSupportTicketList();
    })
    .catch((error) => {
      console.error("❌ Support tickets fetch failed:", error);
      createStatusToast("Couldn’t Load Tickets", error.message || "Please try again.", "error");
      if (!window.supportTicketState) {
        window.supportTicketState = { tickets: [] };
      }

      window.supportTicketState.tickets = [];
      renderSupportTicketList();
    });
}

function statCard(label, value) {
  return `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;background:#f9fafb;">
      <div style="font-size:24px;font-weight:700;">${value}</div>
      <div style="font-size:14px;color:#6b7280;">${label}</div>
    </div>
  `;
}

function dropdown(id, label, items) {
  return `
  <div style="position:relative;">
    <button id="${id}Btn" style="
      padding:10px 12px;border-radius:6px;border:1px solid #d1d5db;
      background:#fff;font-size:14px;cursor:pointer;min-width:140px;
    ">${label} ▼</button>

    <div id="${id}Menu" style="
      display:none;position:absolute;top:44px;left:0;background:#fff;
      border:1px solid #e5e7eb;border-radius:6px;min-width:160px;
      box-shadow:0 8px 24px rgba(0,0,0,.08);z-index:10;text-align:left;
    ">
      ${items
        .map(
          (i) => `<div class="dd-item" data-value="${i}"
        style="padding:8px 12px;font-size:14px;cursor:pointer;text-align:left;">${i}</div>`
        )
        .join("")}
    </div>
  </div>`;
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function ticketCard({ id, title, tag, desc, status, priority, meta, date }) {
  const safeTitle = escapeHtml(title || "");
  const safeTag = escapeHtml(tag || "General");
  const safeDesc = escapeHtml(desc || "No description provided.");
  const safeStatus = escapeHtml(status || "Open");
  const safePriority = escapeHtml(priority || "Medium");
  const safeMeta = escapeHtml(meta || "-");
  const safeDate = escapeHtml(date || "-");

  const searchable = `${safeTitle} ${safeDesc} ${safeMeta}`
    .toLowerCase()
    .replace(/"/g, "&quot;");

  const statusKey = (status || "").toLowerCase();
  const priorityKey = (priority || "").toLowerCase();
  const isClosed = statusKey === "closed" || statusKey === "resolved";

  const statusStyles = {
    open: { background: "#dbeafe", color: "#1d4ed8" },
    "in progress": { background: "#e0e7ff", color: "#4338ca" },
    pending: { background: "#fef3c7", color: "#92400e" },
    resolved: { background: "#dcfce7", color: "#166534" },
    closed: { background: "#e5e7eb", color: "#374151" },
  };

  const priorityStyles = {
    low: "background:#dcfce7;color:#166534;border:1px solid #bbf7d0;",
    medium: "background:#fef3c7;color:#92400e;border:1px solid #fde68a;",
    high: "background:#ffedd5;color:#9a3412;border:1px solid #fed7aa;",
    urgent: "background:#fee2e2;color:#991b1b;border:1px solid #fecaca;",
  };

  const statusStyle = statusStyles[statusKey] || {
    background: "#ede9fe",
    color: "#6b21a8",
  };

  return `
  <div class="support-ticket-card"
    data-id="${id || ""}"
    data-search="${searchable}"
    data-status="${statusKey}"
    data-priority="${priorityKey}"
    style="
      border:1px solid #e5e7eb;
      border-radius:8px;
      padding:16px;
      cursor:pointer;
      transition:box-shadow 0.2s ease;
    "
    onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'"
    onmouseout="this.style.boxShadow='none'"
  >

    <div style="display:flex;justify-content:space-between;align-items:flex-start;">

      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <h3 style="margin:0;font-weight:500;font-size:16px;color:#111827;">
            ${safeTitle}
          </h3>
        </div>

        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.4;text-align:left;">
          ${safeDesc}
        </p>

        <div style="display:flex;justify-content:space-between;font-size:14px;color:#6b7280;margin-top:10px;">
          <div>${safeMeta}</div>
          <span>${safeDate}</span>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;margin-left:16px;">

        ${
          !isClosed
            ? `
        <button 
          class="close-ticket-btn"
          data-ticket-id="${id}"
          style="
            border:1px solid #d1d5db;
            background:#fff;
            border-radius:999px;
            padding:4px 12px;
            font-size:12px;
            font-weight:600;
            cursor:pointer;
          "
        >
          Close Ticket
        </button>
        `
            : ""
        }

        <div style="
          display:inline-flex;
          border-radius:999px;
          padding:2px 10px;
          font-size:12px;
          font-weight:600;
          background:${statusStyle.background};
          color:${statusStyle.color};
        ">
          ${safeStatus}
        </div>

        <div style="
          display:inline-flex;
          border-radius:999px;
          padding:2px 10px;
          font-size:12px;
          font-weight:600;
          ${priorityStyles[priorityKey] || ""}
        ">
          ${safePriority}
        </div>

      </div>
    </div>
  </div>
  `;
}

async function closeSupportTicket(ticketId) {
  if (!ticketId) return;

  const button = document.querySelector(`[data-ticket-id="${ticketId}"]`);
  if (button) {
    button.disabled = true;
    button.innerText = "Closing...";
    button.style.cursor = "not-allowed";
  }

  const { web_url, customer_id, email } = getSupportTicketRequestContext();

  try {
    const response = await fetch(getSupportApiUrl(`${getSupportTicketApi().ticketsPath}/close`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: ticketId,
        status: "closed",
        web_url,
        customer_id,
        email,
      }),
    });

    const data = await response.json();

    if (!response.ok || data?.status !== "success") {
      throw new Error(data?.message || "Failed to close ticket");
    }

    // Update local state
    window.supportTicketState.tickets =
      window.supportTicketState.tickets.map(ticket =>
        ticket.id == ticketId
          ? { ...ticket, status: "closed" }
          : ticket
      );

    createStatusToast("Ticket Closed", "Ticket has been closed successfully.", "success");

    renderSupportTicketList();

  } catch (error) {
    console.error("❌ Close ticket failed:", error);
    createStatusToast("Error", error.message || "Failed to close ticket", "error");

    if (button) {
      button.disabled = false;
      button.innerText = "Close Ticket";
      button.style.cursor = "pointer";
    }
  }
}

function attachCloseTicketLogic() {
  document.querySelectorAll(".close-ticket-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation(); // 🚨 Prevent modal opening
      const ticketId = btn.dataset.ticketId;
      closeSupportTicket(ticketId);
    });
  });
}

function ticketConversationModal() {
  return `
  <div id="ticketConversationModal" style="
    display:none;position:fixed;inset:0;background:rgba(17,24,39,.60);
    justify-content:center;align-items:center;z-index:1001;padding:24px;
  ">
    <div style="
      position:relative;background:#ffffff;border-radius:14px;width:100%;max-width:800px;
      max-height:95vh;overflow-y:auto;box-shadow:0 22px 44px -12px rgba(15,23,42,.45);
      border:1px solid #e5e7eb;padding:22px 24px;
      font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
    ">

      <button id="closeTicketConversation" type="button" style="
        position:absolute;right:18px;top:14px;background:transparent;border:none;
        color:#6b7280;font-size:22px;line-height:1;cursor:pointer;padding:0;
      ">×</button>

      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="display:inline-flex;width:18px;height:18px;color:#2563eb;">
          <span style="display:inline-flex;width:20px;height:20px;color:#2563eb;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg></span>
        </span>
        <h2 id="conversationTitle" style="
          margin:0;font-size:24px;font-weight:600;color:#111827;
        ">Ticket Conversation</h2>
      </div>

      <div style="background:#f3f4f6;border-radius:12px;padding:12px 4px;margin-bottom:16px;">
        <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;">

          <div>
            <p style="margin:0 0 3px;color:#6b7280;font-size:13px;">Ticket ID</p>
            <p id="conversationTicketId" style="margin:0;font-size:15px;font-weight:600;">-</p>
          </div>

          <div>
            <p style="margin:0 0 3px;color:#6b7280;font-size:13px;">Type</p>
            <span id="conversationType" style="
              display:inline-flex;padding:2px 10px;border-radius:999px;
              background:#e9d5ff;color:#6b21a8;font-size:12px;font-weight:600;
            ">General</span>
          </div>

          <div>
            <p style="margin:0 0 3px;color:#6b7280;font-size:13px;">Status</p>
            <span id="conversationStatus" style="
              display:inline-flex;padding:2px 10px;border-radius:999px;
              background:#e0e7ff;color:#4338ca;font-size:12px;font-weight:600;
            ">In Progress</span>
          </div>

          <div>
            <p style="margin:0 0 3px;color:#6b7280;font-size:13px;">Priority</p>
            <span id="conversationPriority" style="
              display:inline-flex;padding:2px 10px;border-radius:999px;
              background:#fef3c7;color:#92400e;font-size:12px;font-weight:600;
            ">Medium</span>
          </div>

          <div>
            <p style="margin:0 0 3px;color:#6b7280;font-size:13px;">Created</p>
            <p id="conversationCreatedAt" style="
              margin:0;font-size:14px;font-weight:500;line-height:1.3;
            ">-</p>
          </div>

        </div>
      </div>

      <div id="conversationThread" style="
        display:flex;flex-direction:column;gap:10px;margin-bottom:16px;
      ">
        
        <div style="
          align-self:flex-end;background:#2563eb;color:#fff;
          max-width:75%;padding:10px 12px;border-radius:12px;
        ">
          <div style="font-size:12px;margin-bottom:4px;text-align:left;">
            <strong>You</strong>
            <span id="conversationCustomerDate" style="opacity:.85;margin-left:4px;">-</span>
          </div>
          <div id="conversationCustomerMessage"
            style="font-size:14px;line-height:1.4;text-align:left;">
            No message available.
          </div>
        </div>

        <div style="
          align-self:flex-start;background:#f3f4f6;color:#111827;
          max-width:75%;padding:10px 12px;border-radius:12px;
        ">
          <div style="font-size:12px;margin-bottom:4px;text-align:left;">
            <strong>Support Team</strong>
            <span id="conversationSupportDate" style="opacity:.7;margin-left:4px;">-</span>
          </div>
          <div id="conversationSupportMessage"
            style="font-size:14px;line-height:1.4;text-align:left;">
            Thanks for contacting support. Our team is reviewing your ticket.
          </div>
        </div>

      </div>

      <div style="border-top:1px solid #e5e7eb;padding-top:12px;">
        
        <label for="conversationMessageInput" style="
          display:block;margin:0 0 6px;font-size:14px;
          font-weight:600;color:#111827;text-align:left;
        ">Send a message</label>

        <textarea id="conversationMessageInput"
          placeholder="Type your message here..."
          style="
            width:100%;min-height:80px;
            border:1.5px solid #93c5fd;border-radius:12px;
            padding:10px;font-size:14px;
            resize:vertical;outline:none;box-sizing:border-box;
        "></textarea>

        <div style="display:flex;justify-content:flex-end;margin-top:8px;">
          <button type="button" id="conversationSendBtn" disabled style="
            background:#93c5fd;color:#fff;border:none;
            border-radius:10px;padding:8px 16px;
            font-size:14px;font-weight:600;
            display:inline-flex;align-items:center;gap:6px;
            cursor:not-allowed;
            opacity:0.75;
          ">✈ Send Message</button>
        </div>

      </div>

    </div>
  </div>`;
}


var applySupportFilters = null;

function attachSupportTicketsLogic() {
  const searchInput = document.getElementById("supportTicketSearch");
  const statusBtn = document.getElementById("statusDropdownBtn");
  const priorityBtn = document.getElementById("priorityDropdownBtn");
  const statusMenu = document.getElementById("statusDropdownMenu");
  const priorityMenu = document.getElementById("priorityDropdownMenu");
  const emptyState = document.getElementById("supportTicketEmptyState");

  if (!searchInput) return;
  if (searchInput.dataset.bound === "true") return;
  searchInput.dataset.bound = "true";

  const normalize = (value = "") => value.toLowerCase().trim().replace(/\s+/g, " ");
  const selectedValueFromBtn = (btn, allLabel) => {
    const rawValue = normalize((btn?.innerText || allLabel).replace("▼", ""));
    return rawValue === allLabel.toLowerCase() ? "all" : rawValue;
  };

  applySupportFilters = () => {
    const ticketCards = Array.from(document.querySelectorAll(".support-ticket-card"));
    const searchTerm = normalize(searchInput.value);
    const selectedStatus = selectedValueFromBtn(statusBtn, "all status");
    const selectedPriority = selectedValueFromBtn(priorityBtn, "all priority");

    let visibleCount = 0;

    ticketCards.forEach((card) => {
      const searchText = normalize(card.dataset.search || "");
      const status = normalize(card.dataset.status || "");
      const priority = normalize(card.dataset.priority || "");

      const searchMatch = !searchTerm || searchText.includes(searchTerm);
      const statusMatch = selectedStatus === "all" || status === selectedStatus;
      const priorityMatch = selectedPriority === "all" || priority === selectedPriority;
      const isVisible = searchMatch && statusMatch && priorityMatch;

      card.style.display = isVisible ? "block" : "none";
      if (isVisible) visibleCount += 1;
    });

    if (emptyState) emptyState.style.display = visibleCount === 0 ? "block" : "none";
  };

  searchInput.addEventListener("input", applySupportFilters);

  [statusMenu, priorityMenu].forEach((menu) => {
    if (!menu) return;
    menu.querySelectorAll(".dd-item").forEach((item) => {
      item.addEventListener("click", applySupportFilters);
    });
  });
  applySupportFilters();
}

function attachTicketConversationModalLogic() {
  const modal = document.getElementById("ticketConversationModal");
  const closeBtn = document.getElementById("closeTicketConversation");
  const container = document.getElementById("supportTicketList");

  if (!modal || !container) return;

  // Use event delegation (VERY IMPORTANT)
  container.addEventListener("click", (event) => {
    const card = event.target.closest(".support-ticket-card");

    // If clicked close button → ignore (you already stopPropagation there)
    if (!card) return;

    modal.style.display = "flex";
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
}

function getSupportApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const { baseUrl } = getSupportTicketApi();
  if (!baseUrl) return normalizedPath;

  return `${baseUrl.replace(/\/$/, "")}${normalizedPath}`;
}

function parseSupportApiResponse(response) {
  return response.text().then((rawBody) => {
    let data = null;

    if (rawBody) {
      try {
        data = JSON.parse(rawBody);
      } catch (error) {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        throw new Error("Received an invalid response from support service");
      }
    }

    return { ok: response.ok, data };
  });
}


function getSupportTicketRequestContext() {
  const resolvedEmail = typeof customerEmail !== "undefined" && customerEmail
    ? customerEmail
    : (typeof profile_email !== "undefined" ? profile_email : "");

  const resolvedCustomerId = typeof customerId !== "undefined" ? Number(customerId) : 0;

  return {
    web_url: Shopify?.shop,
    customer_id: resolvedCustomerId,
    email: resolvedEmail,
  };
}

function createSupportTicket() {
  const ticketType = document.getElementById("ticketTypeInput")?.value?.trim().toLowerCase();
  const subject = document.getElementById("ticketSubjectInput")?.value?.trim();
  const description = document.getElementById("ticketDescriptionInput")?.value?.trim();
  const priority = (document.getElementById("ticketPriorityValue")?.value || "Medium").toLowerCase();
  const submitButton = document.getElementById("createTicketSubmitBtn");

  if (!ticketType || !subject || !description) {
    createStatusToast("Missing Fields", "Ticket type, subject and description are required.", "error");
    return;
  }

  const { web_url, customer_id, email } = getSupportTicketRequestContext();
  const firstName = typeof profile_first_name !== "undefined" ? profile_first_name : "";
  const lastName = typeof profile_last_name !== "undefined" ? profile_last_name : "";
  const phone = typeof customer_phone !== "undefined" ? customer_phone : "";

  const payload = {
    web_url,
    customer_id,
    email,
    raised_by: {
      user_id: String(customer_id),
      user_type: "customer",
      email,
      name: `${firstName} ${lastName}`.trim(),
    },
    customer_details: {
      customer_id,
      customer_first_name: firstName,
      customer_last_name: lastName,
      customer_email: email || "",
      customer_phone: phone,
    },
    content: {
      subject,
      description,
      attachment: [],
    },
    additional_details: {
      department: ticketType,
      priority,
      tags: [],
    },
  };

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Creating...";
  }

  fetch(getSupportApiUrl(getSupportTicketApi().ticketsPath), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(parseSupportApiResponse)
    .then(({ ok, data }) => {
      if (!ok || data?.status !== "success") {
        throw new Error(data?.message || "Failed to create ticket");
      }

      createStatusToast("Ticket Created", "Your support ticket has been submitted.", "success");
      const ticketModal = document.getElementById("ticketModal");
      if (ticketModal) ticketModal.style.display = "none";
      fetchAndRenderSupportTickets();
    })
    .catch((error) => {
      console.error("❌ Ticket create failed:", error);
      createStatusToast("Couldn’t Create Ticket", error.message || "Please try again.", "error");
    })
    .finally(() => {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "+ Create Ticket";
      }
    });
}

function createTicketModal() {
  const priorityBadgeStyles = {
    Low: "background:#dcfce7;color:#166534;border:1px solid #bbf7d0;",
    Medium: "background:#fef3c7;color:#92400e;border:1px solid #fde68a;",
    High: "background:#ffedd5;color:#9a3412;border:1px solid #fed7aa;",
    Urgent: "background:#fee2e2;color:#991b1b;border:1px solid #fecaca;",
  };

  const priorityOptionRow = (value) => `
    <button type="button" class="priority-option-item" data-value="${value}" style="
      width:100%;display:flex;align-items:center;gap:8px;border:none;background:transparent;
      padding:6px 10px;cursor:pointer;text-align:left;
    ">
      <span class="priority-option-check" style="width:14px;color:#111827;font-size:14px;visibility:hidden;">✓</span>
      <span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:999px;font-size:15px;line-height:1;font-weight:600;${priorityBadgeStyles[value]}">${value}</span>
    </button>
  `;

  return `
  <div id="ticketModal" style="
    display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);
    justify-content:center;align-items:center;z-index:1000;
  ">
    <div style="
      background:#fff;
      border-radius:10px;
      width:420px;
      max-width:calc(100vw - 24px);
      padding:20px;
      position:relative;
    ">
      <button id="closeModalX" style="
        position:absolute;
        top:12px;
        right:12px;
        background:transparent;
        border:none;
        font-size:18px;
        cursor:pointer;
        color:#6b7280;
      ">✕</button>

      <h3 style="margin:0 0 12px;">Create New Support Ticket</h3>

      <label style="display:block; margin-bottom:4px;text-align:left;">Ticket Type <span style="color:red;">*</span></label>
      <select id="ticketTypeInput" style="width:100%;padding:8px;margin-bottom:10px;">
        <option value="">Select ticket type</option>
        <option value="order enquiry">📦 Order Enquiry</option>
        <option value="return request">↩️ Return Request</option>
        <option value="refund request">💰 Refund Request</option>
        <option value="delivery issue">🚚 Delivery Issue</option>
        <option value="product defect">⚠️ Product Defect</option>
        <option value="billing enquiry">🧾 Billing Enquiry</option>
        <option value="technical issue">🛠️ Technical Issue</option>
        <option value="general enquiry">ℹ️ General Enquiry</option>
        <option value="complaint">❗ Complaint</option>
        <option value="feedback">💬 Feedback</option>
      </select>

      <!-- 
      <label style="display:block; margin-bottom:4px;text-align:left;">
        Category <span style="color:red;">*</span>
      </label>
      <select id="ticketCategoryInput" style="width:100%;padding:8px;margin-bottom:10px;">
        <option value="">Select category</option>
      </select>

      <label style="display:block; margin-bottom:4px;text-align:left;">
        Sub Category <span style="color:red;">*</span>
      </label>
      <select id="ticketSubCategoryInput" style="width:100%;padding:8px;margin-bottom:10px;" disabled>
        <option value="">Select sub category</option>
      </select> 
      -->

      <div id="relatedOrderField" style="display:none;margin-bottom:10px;">
        <label style="display:block; margin-bottom:4px;text-align: left;">Related Order <span style="color:red;">*</span></label>
        <div id="ticketOrderSelect" style="position:relative;">
          <button type="button" role="combobox" aria-expanded="false" aria-autocomplete="none" id="ticketOrderSelectBtn" style="
            width:100%;min-height:42px;padding:6px 10px;border:1px solid #d1d5db;border-radius:10px;
            display:flex;justify-content:space-between;align-items:center;background:#fff;cursor:pointer;
          ">
            <span id="ticketOrderSelectLabel" style="color:#6b7280;">Select an order</span>
            <span style="color:#6b7280;font-size:16px;line-height:1;">▾</span>
          </button>
          <div id="ticketOrderSelectMenu" style="display:none;position:absolute;left:0;top:calc(100% + 6px);width:100%;max-height:180px;overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 10px 24px rgba(15,23,42,.12);z-index:20;padding:4px 0;"></div>
          <input type="hidden" id="ticketOrderInput" value="" />
        </div>
      </div>

      <label style="display:block; margin-bottom:4px;text-align:left;">Subject <span style="color:red;">*</span></label>
      <input id="ticketSubjectInput" style="width:100%;padding:8px;margin-bottom:10px;" />

      <label style="display:block; margin-bottom:4px;text-align:left;">Priority</label>
      <div id="prioritySelect" style="position:relative;margin-bottom:10px;">
        <button type="button" id="prioritySelectBtn" style="
          width:100%;min-height:42px;padding:6px 10px;border:1px solid #d1d5db;border-radius:10px;
          display:flex;justify-content:space-between;align-items:center;background:#fff;cursor:pointer;
        ">
          <span id="prioritySelectLabel" style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:999px;font-size:15px;line-height:1;font-weight:600;${priorityBadgeStyles.Medium}">Medium</span>
          <span style="color:#6b7280;font-size:16px;line-height:1;">▾</span>
        </button>
        <div id="prioritySelectMenu" style="
          display:none;position:absolute;left:0;top:calc(100% + 6px);width:100%;background:#fff;border:1px solid #e5e7eb;
          border-radius:10px;box-shadow:0 10px 24px rgba(15,23,42,.12);z-index:20;padding:4px 0;
        ">
          ${priorityOptionRow("Low")}
          ${priorityOptionRow("Medium")}
          ${priorityOptionRow("High")}
          ${priorityOptionRow("Urgent")}
        </div>
        <input type="hidden" id="ticketPriorityValue" value="Medium" />
      </div>

      <label style="display:block; margin-bottom:4px;text-align:left;">Description <span style="color:red;">*</span></label>
      <textarea id="ticketDescriptionInput" style="width:100%;padding:8px;height:80px;"></textarea>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
        <button id="closeModal">Cancel</button>
        <button id="createTicketSubmitBtn" style="background:#2563eb;color:#fff;border:none;padding:8px 14px;border-radius:6px;">
          + Create Ticket
        </button>
      </div>
    </div>
  </div>`;
}

function attachPrioritySelectLogic() {
  const selectWrapper = document.getElementById("prioritySelect");
  const selectBtn = document.getElementById("prioritySelectBtn");
  const menu = document.getElementById("prioritySelectMenu");
  const label = document.getElementById("prioritySelectLabel");
  const valueInput = document.getElementById("ticketPriorityValue");

  if (!selectWrapper || !selectBtn || !menu || !label || !valueInput) return;

  const priorityBadgeStyles = {
    Low: "background:#dcfce7;color:#166534;border:1px solid #bbf7d0;",
    Medium: "background:#fef3c7;color:#92400e;border:1px solid #fde68a;",
    High: "background:#ffedd5;color:#9a3412;border:1px solid #fed7aa;",
    Urgent: "background:#fee2e2;color:#991b1b;border:1px solid #fecaca;",
  };

  const setPriority = (selectedValue) => {
    valueInput.value = selectedValue;
    label.textContent = selectedValue;
    label.style.cssText = `display:inline-flex;align-items:center;padding:2px 10px;border-radius:999px;font-size:15px;line-height:1;font-weight:600;${priorityBadgeStyles[selectedValue]}`;

    menu.querySelectorAll(".priority-option-item").forEach((option) => {
      const isSelected = option.dataset.value === selectedValue;
      option.style.background = isSelected ? "#e5e7eb" : "transparent";
      const check = option.querySelector(".priority-option-check");
      if (check) check.style.visibility = isSelected ? "visible" : "hidden";
    });
  };

  setPriority(valueInput.value || "Medium");

  selectBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = menu.style.display === "block";
    menu.style.display = isOpen ? "none" : "block";
  });

  menu.querySelectorAll(".priority-option-item").forEach((option) => {
    option.addEventListener("click", (event) => {
      event.preventDefault();
      setPriority(option.dataset.value);
      menu.style.display = "none";
    });
  });

  document.addEventListener("click", (event) => {
    if (!selectWrapper.contains(event.target)) {
      menu.style.display = "none";
    }
  });
}


function getSupportTicketOrderOptions() {
  const orderSources = [
    window.customerOrders,
    window.orders,
    window.ordersData,
    window.customer_orders,
  ];

  const rawOrders =
    orderSources.find((source) => Array.isArray(source)) || [];

  return rawOrders
    .map((order) => {
      const value =
        order?.orderId || order?.id || order?.order_id || "";

      const label =
        order?.orderNumber ||
        order?.name ||
        order?.order_name ||
        value;

      if (!value || !label) return null;

      return {
        value: String(value),
        label: String(label),
        order: order, // IMPORTANT
      };
    })
    .filter(Boolean);
}

function attachTicketTypeOrderLogic() {
  const ticketTypeInput = document.getElementById("ticketTypeInput");
  const relatedOrderField = document.getElementById("relatedOrderField");

  if (!ticketTypeInput || !relatedOrderField) return;

  const ticketTypesRequiringOrder = new Set([
    "order enquiry",
    "return request",
    "refund request",
    "delivery issue",
  ]);

  const toggleRelatedOrderField = () => {
    const selectedTicketType = ticketTypeInput.value?.trim().toLowerCase();
    const shouldShow = ticketTypesRequiringOrder.has(selectedTicketType);

    relatedOrderField.style.display = shouldShow ? "block" : "none";

    if (!shouldShow) {
      const ticketOrderInput = document.getElementById("ticketOrderInput");
      const ticketOrderSelectLabel = document.getElementById("ticketOrderSelectLabel");
      if (ticketOrderInput) ticketOrderInput.value = "";
      if (ticketOrderSelectLabel) {
        ticketOrderSelectLabel.textContent = "Select an order";
        ticketOrderSelectLabel.style.color = "#6b7280";
      }
    }
  };

  ticketTypeInput.addEventListener("change", toggleRelatedOrderField);
  toggleRelatedOrderField();
}


function attachTicketOrderSelectLogic() {
  const selectWrapper = document.getElementById("ticketOrderSelect");
  const selectBtn = document.getElementById("ticketOrderSelectBtn");
  const menu = document.getElementById("ticketOrderSelectMenu");
  const label = document.getElementById("ticketOrderSelectLabel");
  const valueInput = document.getElementById("ticketOrderInput");

  if (!selectWrapper || !selectBtn || !menu || !label || !valueInput) return;

  const options = getSupportTicketOrderOptions();

  const formatDate = (rawDate) => {
    if (!rawDate) return "";
    const date = new Date(rawDate);
    return date.toLocaleDateString("en-GB");
  };

  const setOrder = (value, selectedLabel, orderData = null) => {
    valueInput.value = value;

    if (!value || !orderData) {
      label.innerHTML = "Select an order";
      label.style.color = "#6b7280";
      return;
    }

    const status = (orderData.fulfillmentStatus || "processing").toLowerCase();
    const total = orderData.totalPrice || "";
    const date = formatDate(orderData.orderTime);
    const firstItem = orderData.items?.[0]?.title || "";

    const statusColor =
      status === "fulfilled"
        ? "background:#dcfce7;color:#166534;"
        : status === "shipped"
        ? "background:#dbeafe;color:#1d4ed8;"
        : status === "partial"
        ? "background:#fef3c7;color:#92400e;"
        : "background:#f3f4f6;color:#374151;";

    label.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:2px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <strong>${escapeHtml(selectedLabel)}</strong>
          <span style="
            padding:2px 8px;
            border-radius:999px;
            font-size:12px;
            font-weight:600;
            ${statusColor}
          ">
            ${escapeHtml(status)}
          </span>
        </div>
        <div style="font-size:12px;color:#6b7280;">
          ${escapeHtml(date)}
          ${total ? ` • ${escapeHtml(total)}` : ""}
          ${firstItem ? ` • ${escapeHtml(firstItem)}` : ""}
        </div>
      </div>
    `;

    label.style.color = "#111827";
  };

  menu.innerHTML = "";

  if (options.length === 0) {
    menu.innerHTML =
      '<div style="padding:10px 14px;color:#6b7280;font-size:14px;">No orders available</div>';
  } else {
    options.forEach((option) => {
      const order = option.order;
      const status = (order.fulfillmentStatus || "processing").toLowerCase();

      const statusColor =
        status === "fulfilled"
          ? "#16a34a"
          : status === "shipped"
          ? "#2563eb"
          : status === "partial"
          ? "#d97706"
          : "#6b7280";

      const itemsPreview = (order.items || [])
        .slice(0, 2)
        .map((item) => item.title)
        .join(", ");

      const orderDate = order.orderTime
        ? new Date(order.orderTime).toLocaleDateString("en-GB")
        : "";

      const optionBtn = document.createElement("button");
      optionBtn.type = "button";
      optionBtn.className = "ticket-order-option-item";
      optionBtn.dataset.value = option.value;

      optionBtn.style.cssText = `
        width:100%;
        border:none;
        background:transparent;
        padding:12px 16px;
        cursor:pointer;
        text-align:left;
        transition:background 0.15s ease;
      `;

      optionBtn.onmouseenter = () => {
        optionBtn.style.background = "#f9fafb";
      };
      optionBtn.onmouseleave = () => {
        optionBtn.style.background = "transparent";
      };

      optionBtn.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
          <strong style="font-size:14px;">
            ${escapeHtml(option.label)}
          </strong>

          <span style="
            font-size:12px;
            padding:3px 8px;
            border-radius:999px;
            background:${statusColor}15;
            color:${statusColor};
            font-weight:600;
          ">
            ${escapeHtml(status)}
          </span>
        </div>

        <div style="font-size:13px;color:#6b7280;">
          ${orderDate}
          ${order.totalPrice ? ` • ${escapeHtml(order.totalPrice)}` : ""}
          ${itemsPreview ? ` • ${escapeHtml(itemsPreview)}` : ""}
        </div>
      `;

      optionBtn.onclick = (event) => {
        event.preventDefault();
        setOrder(option.value, option.label, option.order);
        menu.style.display = "none";
        selectBtn.setAttribute("aria-expanded", "false");
      };

      menu.appendChild(optionBtn);
    });
  }

  selectBtn.onclick = (event) => {
    event.stopPropagation();
    const isOpen = menu.style.display === "block";
    menu.style.display = isOpen ? "none" : "block";
    selectBtn.setAttribute("aria-expanded", isOpen ? "false" : "true");
  };

  document.addEventListener("click", (event) => {
    if (!selectWrapper.contains(event.target)) {
      menu.style.display = "none";
      selectBtn.setAttribute("aria-expanded", "false");
    }
  });

  setOrder(valueInput.value || "", "");
}


function attachDropdownLogic() {
  document.querySelectorAll("[id$='DropdownBtn']").forEach((btn) => {
    btn.onclick = () => {
      const menu = document.getElementById(btn.id.replace("Btn", "Menu"));
      if (!menu) return;
      menu.style.display = menu.style.display === "block" ? "none" : "block";
    };
  });

  document.querySelectorAll(".dd-item").forEach((item) => {
    item.onclick = () => {
      const menu = item.parentElement;
      const btn = document.getElementById(menu.id.replace("Menu", "Btn"));
      if (!btn) return;
      btn.innerText = item.dataset.value + " ▼";
      menu.style.display = "none";
    };
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("[id$='DropdownBtn']")) {
      document.querySelectorAll("[id$='DropdownMenu']").forEach((m) => {
        m.style.display = "none";
      });
    }
  });
}

function attachModalLogic() {
  const openCreateTicketBtn = document.getElementById("openCreateTicket");
  const ticketModal = document.getElementById("ticketModal");
  const closeModalBtn = document.getElementById("closeModal");
  const closeModalXBtn = document.getElementById("closeModalX");
  const createTicketSubmitBtn = document.getElementById("createTicketSubmitBtn");

  if (!openCreateTicketBtn || !ticketModal || !closeModalBtn || !closeModalXBtn || !createTicketSubmitBtn) return;

  openCreateTicketBtn.onclick = () => {
    ticketModal.style.display = "flex";
  };

  closeModalBtn.onclick = () => {
    ticketModal.style.display = "none";
  };

  closeModalXBtn.onclick = () => {
    ticketModal.style.display = "none";
  };

  ticketModal.addEventListener("click", (event) => {
    if (event.target.id === "ticketModal") {
      event.target.style.display = "none";
    }
  });

  createTicketSubmitBtn.onclick = createSupportTicket;
  
  attachPrioritySelectLogic();
  attachTicketTypeOrderLogic();
  attachTicketOrderSelectLogic();
}

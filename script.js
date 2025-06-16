import { getCookie, setCookie } from "./utils.js";

const weekBeginsOnMonday = true; // Set to false if week starts on Sunday

$(function () {
   initView();
   initCalendar();
   initListeners();
});

function initView() {
   const timeframe = getCookie("timeframe") || "day";

   $(content).attr("view", timeframe);
   $(timeframeSelector)
      .find(`button[data-timeframe="${timeframe}"]`)
      .addClass("active");
}

function initCalendar() {
   const date = new Date();
   const month = date.getMonth();
   const year = date.getFullYear();

   const monthName = date.toLocaleString("default", { month: "long" });
   $(currentMonth).text(monthName).removeClass("loading");

   let firstDay = new Date(year, month, 1).getDay();
   const daysInMonth = new Date(year, month, 0).getDate();

   if (weekBeginsOnMonday) {
      firstDay = (firstDay + 6) % 7; // Adjust for Monday start
   }
   //get previous month
   const prevMonth = new Date(year, month - 1, 0);
   const prevDaysInMonth = prevMonth.getDate();

   const day = $('<div class="day">');
   let daySlots = 42; // 6 rows of 7 days
   if (firstDay + daysInMonth < 36) {
      daySlots = 35; // 5 rows of 7 days
   }
   for (let i = 0; i < daySlots; i++) {
      const currentDay = day.clone();
      let dayNumber = i - firstDay + 1; // Adjust for first day offset
      if (i < firstDay) {
         dayNumber = prevDaysInMonth - (firstDay - i) + 1; // Previous month days
         currentDay.addClass("prev");
      } else if (i >= firstDay + daysInMonth) {
         dayNumber = dayNumber - daysInMonth; // Next month days
         currentDay.addClass("next");
      }
      currentDay.text(dayNumber);
      $(calendar).append(currentDay);
   }
}

function initListeners() {
   $(timeframeSelector).find("button").on("click", setTimeframe);
}

function setTimeframe(e) {
   $(timeframeSelector).find(".active").removeClass("active");
   const button = $(e.currentTarget).addClass("active");

   const timeframe = button.data("timeframe");
   $(content).attr("view", timeframe);

   setCookie("timeframe", timeframe, 365);
}

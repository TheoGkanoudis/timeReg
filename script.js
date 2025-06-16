import { getCookie, setCookie } from "./utils.js";

const weekBeginsOnMonday = true;

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
   setMonth();
}

function initListeners() {
   $(timeframeSelector).find("button").on("click", setTimeframe);
   $(calendar).on("click", changeDay);
   $(prevMonth).on("click", () =>
      setMonth(parseInt($(calendar).attr("distance")) - 1)
   );
   $(nextMonth).on("click", () =>
      setMonth(parseInt($(calendar).attr("distance")) + 1)
   );
}

function setMonth(distance = 0) {
   const date = new Date();
   const month = date.getMonth();
   const year = date.getFullYear();

   //get the selected month and set name
   const selectedMonth = new Date(year, month + distance, 1);
   const monthName = selectedMonth.toLocaleString("default", { month: "long" });
   const yearNo = selectedMonth.getFullYear();
   const monthNo = selectedMonth.getMonth();
   const dayNo = date.getDate();
   $(currentMonth).text(monthName).removeClass("loading");
   $(currentYear).text(yearNo).removeClass("loading");

   //set the calendar content
   $(calendar).empty();

   let firstDay = selectedMonth.getDay();
   if (weekBeginsOnMonday) {
      firstDay = (firstDay + 6) % 7; // Adjust for Monday start
      $(".calendar-body-header").append($(sunday));
   }

   let weekCount = 6;
   let dayCount = -firstDay;
   const daysInMonth = new Date(year, month + distance + 1, 0).getDate();
   const daysInPreviousMonth = new Date(year, month + distance, 0).getDate();

   if (firstDay + daysInMonth < 36) {
      weekCount = 5;
   }

   const day = $('<div class="day">');
   const week = $('<div class="week">');

   for (let w = 0; w < weekCount; w++) {
      const currentWeek = week.clone();
      for (let d = 0; d < 7; d++) {
         const currentDay = day.clone();
         dayCount++;

         //current month
         let dayText = dayCount;
         let monthText = monthNo + 1;
         let yearText = yearNo;
         //previous month
         if (dayCount <= 0) {
            dayText = daysInPreviousMonth + dayCount;
            monthText = monthNo;
            currentDay.addClass("prev");
            //previous year
            if (monthNo === 0) {
               yearText = yearNo - 1;
               monthText = 12;
            }
         }
         //next month
         if (dayCount > daysInMonth) {
            dayText = dayCount - daysInMonth;
            monthText = monthNo + 2;
            currentDay.addClass("next");
            //next year
            if (monthNo === 11) {
               yearText = yearNo + 1;
               monthText = 1;
            }
         }

         const daySpan = $("<span>").text(dayText);
         currentDay
            .append(daySpan)
            .attr("data-date", `${dayText}-${monthText}-${yearText}`);

         currentWeek.append(currentDay);
      }
      $(calendar).append(currentWeek);
   }

   if (distance === 0) {
      $(calendar)
         .find(`.day[data-date="${dayNo}-${month + 1}-${year}"]`)
         .addClass("active today");
   }
   $(calendar).attr("distance", distance);
}

function setTimeframe(e) {
   $(timeframeSelector).find(".active").removeClass("active");
   const button = $(e.currentTarget).addClass("active");

   const timeframe = button.data("timeframe");
   $(content).attr("view", timeframe);

   setCookie("timeframe", timeframe, 365);
}

function changeDay(e) {
   let target = $(e.target);
   if (target.is("span")) {
      target = target.parent();
   }
   if (!target.hasClass("day")) {
      return;
   }
   $(calendar).find(".active").removeClass("active");
   target.addClass("active");
}

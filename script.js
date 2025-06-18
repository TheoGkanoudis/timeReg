import { getCookie, setCookie } from "./utils.js";
import { setTimetable } from "./timetable.js";

const transitionDuration =
   parseFloat($(":root").css("--transition-duration")) * 1000;

const weekBeginsOnMonday = true;

var selectedDay = new Date();
var confidenceLvl;
var selectedWeekStart, selectedWeekEnd;

$(function () {
   initView();
   setMonth(true);
   listenersInit();
});

function initView() {
   const timeframe = getCookie("timeframe") || "day";
   confidenceLvl = getCookie("confidence") || "0.5";

   $(content).attr("view", timeframe);
   $(timeframeSelector)
      .find(`button[data-timeframe="${timeframe}"]`)
      .addClass("active");
}

function listenersInit() {
   $(timeframeSelector).find("button").on("click", setTimeframe);
   $(calendar).on("click", changeDay);
   $(prevMonth).on("click", () =>
      setMonth(false, parseInt($(calendar).attr("distance")) - 1)
   );
   $(nextMonth).on("click", () =>
      setMonth(false, parseInt($(calendar).attr("distance")) + 1)
   );
   $(reset).on("click", function () {
      selectedDay = new Date();
      setMonth(true, 0);
   });
   $(confidence).on("input", changeConfidence);
}

function setMonth(boot, distance = 0) {
   const date = new Date();
   const month = date.getMonth();
   const year = date.getFullYear();

   //get the selected month and set name
   const selectedMonth = new Date(year, month + distance, 1);
   const monthName = selectedMonth.toLocaleString("default", { month: "long" });
   const yearNo = selectedMonth.getFullYear();
   const monthNo = selectedMonth.getMonth();
   const dayNo = date.getDate();

   $(currentMonth).text(monthName);
   $(currentYear).text(yearNo);

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
         //weekends
         if (
            d === 6 ||
            (weekBeginsOnMonday && d === 5) ||
            (!weekBeginsOnMonday && d === 0)
         ) {
            currentDay.addClass("holiday weekend");
         }

         const daySpan = $("<span>").text(dayText);
         currentDay
            .append(daySpan)
            .attr("data-date", `${dayText}-${monthText}-${yearText}`);

         currentWeek.append(currentDay);
      }
      $(calendar).append(currentWeek);
   }

   //set current day
   if (distance === 0) {
      $(calendar)
         .find(`.day[data-date="${dayNo}-${month + 1}-${year}"]`)
         .addClass("today");
   }
   //set active day
   $(calendar)
      .find(
         `.day[data-date="${selectedDay.getDate()}-${
            selectedDay.getMonth() + 1
         }-${selectedDay.getFullYear()}"]`
      )
      .addClass("active");
   if (boot) {
      setActiveWeek();
   }

   //change animation
   const prevDistace = parseInt($(calendar).attr("distance")) || 0;
   const animationClass =
      prevDistace < distance
         ? "fade-left"
         : prevDistace === distance
         ? ""
         : "fade-right";
   $(calendar).addClass(animationClass);
   setTimeout(() => {
      $(calendar).removeClass(animationClass);
   }, transitionDuration);

   $(calendar).attr("distance", distance);
}

function setTimeframe(e) {
   $(timeframeSelector).find(".active").removeClass("active");
   const button = $(e.currentTarget).addClass("active");

   const timeframe = button.data("timeframe");
   $(content).attr("view", timeframe);

   setCookie("timeframe", timeframe, 30);
   setTimetable(selectedDay, selectedWeekStart, selectedWeekEnd, confidenceLvl);
}

function changeDay(e) {
   let target = $(e.target);
   if (target.is("span")) {
      target = target.parent();
   }
   // if in week view, select first day of week
   if ($('[view="week"]').length) {
      if (!target.is(".week")) {
         target = target.closest(".week");
      }
      target = target.find(".day").first();
   }
   if (!target.hasClass("day")) {
      return;
   }
   //set selected day
   const dateParts = target.data("date").split("-");
   selectedDay = new Date(
      parseInt(dateParts[2]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[0])
   );

   // if selected day in other month, change month
   if (target.is(".prev, .next")) {
      setMonth(
         false,
         parseInt($(calendar).attr("distance")) + (target.is(".prev") ? -1 : 1)
      );
      target = $(calendar).find(`.day[data-date="${target.data("date")}"]`);
   }

   //select day
   $(calendar).find(".active").removeClass("active");
   target.addClass("active");
   setActiveWeek();
}

function setActiveWeek() {
   const newActive = $(calendar).find(
      `.day[data-date="${selectedDay.getDate()}-${
         selectedDay.getMonth() + 1
      }-${selectedDay.getFullYear()}"]`
   );
   //set selected week
   const firstOfWeek = newActive
      .parent()
      .find(".day")
      .first()
      .data("date")
      .split("-");

   const lastOfWeek = newActive
      .parent()
      .find(".day")
      .last()
      .data("date")
      .split("-");

   selectedWeekStart = new Date(
      firstOfWeek[2],
      firstOfWeek[1] - 1,
      firstOfWeek[0]
   );

   selectedWeekEnd = new Date(lastOfWeek[2], lastOfWeek[1] - 1, lastOfWeek[0]);
   setTimetable(selectedDay, selectedWeekStart, selectedWeekEnd, confidenceLvl);
}

function changeConfidence(e) {
   confidenceLvl = $(e.currentTarget).val() / 100;
   setCookie("confidence", confidenceLvl, 30);
   setTimetable(selectedDay, selectedWeekStart, selectedWeekEnd, confidenceLvl);
}

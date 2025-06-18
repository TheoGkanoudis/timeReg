const workDayStart = 9;
const workDayEnd = 17;

var selectedDay = new Date();
var selectedWeekStart;
var selectedWeekEnd;
var confidenceLvl;

const loadedDays = new Map();
var currentDay;

class Day {
   constructor(date, logs) {
      this.date = date;
      this.logs = logs;
   }
}

$(function () {});

function setDayHeader() {
   const dayName = selectedDay.toLocaleString("default", {
      weekday: "short",
   });
   const dateNo = selectedDay.toLocaleDateString("default", {
      day: "numeric",
   });
   const monthName = selectedDay.toLocaleString("default", {
      month: "short",
   });

   $(timetableDayHeader).find(".month").text(monthName);
   $(timetableDayHeader).find(".date").text(dateNo);
   $(timetableDayHeader).find(".day").text(dayName);
}

function setWeekHeader() {
   const startMonthName = selectedWeekStart.toLocaleString("default", {
      month: "short",
   });
   const startDateNo = selectedWeekStart.toLocaleDateString("default", {
      day: "numeric",
   });
   const endMonthName = selectedWeekEnd.toLocaleString("default", {
      month: "short",
   });
   const endDateNo = selectedWeekEnd.toLocaleDateString("default", {
      day: "numeric",
   });

   $(timetableWeekHeader).find(".start-month").text(startMonthName);
   $(timetableWeekHeader).find(".start-date").text(startDateNo);
   $(timetableWeekHeader)
      .find(".end-month")
      .text(startMonthName == endMonthName ? "" : endMonthName);
   $(timetableWeekHeader).find(".end-date").text(endDateNo);
}

function renderLogsView(elm, dayData) {
   elm.find(".logs-view").html(
      dayData.date.toLocaleDateString("default", {
         weekday: "long",
         month: "long",
         day: "numeric",
      })
   );
}

function renderSuggestionsView(elm, dayData) {
   elm.find(".suggestions-view").html(
      confidenceLvl +
         "<br>" +
         dayData.suggestions
            .map(
               (s) =>
                  `<h3 class="suggestion-title">${s.appName}</h3>
            <div class="suggestion-dscription">${s.description}</div>`
            )
            .join("")
   );
}

export function setTimetable(dSelected, wStart, wEnd, conf) {
   selectedDay = dSelected;
   selectedWeekStart = wStart;
   selectedWeekEnd = wEnd;
   confidenceLvl = conf;

   if ($("[view='day']").length) {
      $(content)
         .attr("start-day", dSelected.toDateString())
         .removeAttr("end-day");
      setDayHeader();
      dayTimetableInit(dSelected, 0, true);
      return;
   }
   if ($("[view='week']").length) {
      $(content)
         .attr("start-day", wStart.toDateString())
         .attr("end-day", wEnd.toDateString());
      setWeekHeader();
      for (let i = 0; i < 7; i++) {
         const day = new Date(wStart);
         day.setDate(day.getDate() + i);
         dayTimetableInit(day, i);
      }
      return;
   }

   async function dayTimetableInit(day, i, shaveWeek = false) {
      //remove potential week leftovers
      if (shaveWeek) {
         $(timetable).find(".day:not(#templateDay):not(:first-child)").remove();
      }

      let existingElements = $(timetable).find(".day:not(#templateDay)");
      let dayElement = $();
      if (existingElements.length) {
         dayElement = existingElements.eq(i);
      }
      if (!dayElement.length) {
         dayElement = $(templateDay).clone().removeAttr("id");
         $(timetable).append(dayElement);
      }

      //set the DOM framework for the day
      const dayData = await fetchDayData(day);

      //populate the day
      renderLogsView(dayElement, dayData);
      renderSuggestionsView(dayElement, dayData);
   }

   async function fetchDayData(day) {
      //check if the day is already loaded
      if (loadedDays.has(day.toDateString())) {
         currentDay = loadedDays.get(day.toDateString());
         return currentDay;
      }

      //fetch the suggestions and logs for the day
      const logs = await fetchLogs();
      const suggestions = await fetchSuggestions();
      currentDay = new Day(day, logs);
      currentDay.suggestions = suggestions;
      loadedDays.set(day.toDateString(), currentDay);
      return currentDay;

      async function fetchLogs() {
         //this is a temporary local solution
         //this is where you would fetch the logs data from the server
         return [];
      }

      async function fetchSuggestions() {
         //this is a temporary local solution
         //this is where you would fetch the suggestions data from the server
         return fetch("./interactions/day1.json")
            .then((response) => response.json())
            .then((data) => {
               const daySuggestions = data.workDay;
               return daySuggestions;
            })
            .catch((error) => {
               return [];
            });
      }
   }
}

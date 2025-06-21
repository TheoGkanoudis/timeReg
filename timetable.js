const workDayStart = 8;
const workDayEnd = 16;
const suggestionBlockMargin = 60;

var selectedDay = new Date();
var selectedWeekStart;
var selectedWeekEnd;
var confidenceLvl;
var suggestions = [];
var quarterHeight;

const loadedDays = new Map();
var currentDay;

class Day {
   constructor(date, logs) {
      this.date = date;
      this.logs = logs;
   }
}

class Suggestion {
   constructor() {
      this.interactions = [];
      this.apps = [];
   }
   renderToSuggestions(
      sheet,
      totalSuggestions,
      inPosition = null,
      replace = false,
      newSuggestion = false
   ) {
      //create a suggestion element from the template
      const suggestionElm = $(templateSuggestion)
         .clone()
         .attr("id", `suggestion-${this.id}`)
         .attr("data-id", this.id)
         .addClass(replace ? "expanded" : newSuggestion ? "new expanded" : "");
      //title - todo: make this  dynamic
      suggestionElm
         .find(".suggestion-title")
         .text(this.interactions[0].appName);
      //description - todo: make this  dynamic
      suggestionElm
         .find(".suggestion-description")
         .text(this.interactions[0].description);
      //start and end time
      const timeStartString = this.interactions[0].timeA
         .toString()
         .padStart(4, "0")
         .replace(/(\d{2})(\d{2})/, "$1:$2");
      const timeEndString = this.interactions[
         this.interactions.length - 1
      ].timeB
         .toString()
         .padStart(4, "0")
         .replace(/(\d{2})(\d{2})/, "$1:$2");

      suggestionElm
         .find(".suggestion-details .time-start")
         .text(timeStartString);
      suggestionElm.find(".suggestion-details .time-end").text(timeEndString);

      //interactions
      for (const i of this.interactions) {
         const interactionContainer = suggestionElm.find(
            ".suggestion-interactions"
         );
         const interactionElm = suggestionElm
            .find(".interaction.template")
            .clone()
            .removeClass("template")
            .attr("data-id", i.id);
         interactionElm.find(".app span").text(i.appName);
         interactionElm.find(".description").text(i.description);
         interactionElm.find(".time-start").text(
            i.timeA
               .toString()
               .padStart(4, "0")
               .replace(/(\d{2})(\d{2})/, "$1:$2")
         );
         interactionElm.find(".time-end").text(
            i.timeB
               .toString()
               .padStart(4, "0")
               .replace(/(\d{2})(\d{2})/, "$1:$2")
         );
         interactionContainer.append(interactionElm);
      }
      //apps
      for (const app of this.apps) {
         const appsContainer = suggestionElm.find(".suggestion-apps");
         const appsElm = suggestionElm
            .find(".app.template")
            .clone()
            .removeClass("template");
         appsElm.find("span").text(app);
         appsContainer.append(appsElm);
      }
      //add the suggestion to the sheet
      if (inPosition != null) {
         const positionedElm = sheet
            .find(".suggestion:not(.template)")
            .eq(inPosition);
         if (replace) positionedElm.replaceWith(suggestionElm);
         else positionedElm.after(suggestionElm);
      } else {
         sheet.append(suggestionElm);
      }
      //set details max height for animations
      let detailsHeight;
      const detailsElm = suggestionElm.find(".suggestion-details");
      if (replace || newSuggestion) {
         const appsElm = suggestionElm.find(".suggestion-apps");
         const timesElm = suggestionElm.find(".suggestion-details .times");
         detailsHeight = appsElm.outerHeight() + timesElm.outerHeight() + 4;
      } else {
         detailsHeight = detailsElm.outerHeight();
      }
      detailsElm.css("max-height", detailsHeight + "px");

      //set interactions max height for animations
      let interactionsHeight = 0;
      const interactionsElm = suggestionElm.find(".suggestion-interactions");
      interactionsElm.find(".interaction:not(.template)").each(function () {
         interactionsHeight += $(this).outerHeight();
      });
      //define margins for max height
      const suggestionIndex = suggestions.findIndex((s) => s.id == this.id);
      const blockMargins =
         suggestionIndex > 0 && suggestionIndex < totalSuggestions - 1 ? 2 : 1;
      suggestionBlockMargin *
         (totalSuggestions <= 3 ? totalSuggestions - 1 : 2);
      //set heights for collapsed and expanded states - introduce delay to ensure animations are finished
      setTimeout(() => {
         const headerHeight =
            suggestionElm.find(".suggestion-description").outerHeight() +
            suggestionElm.find(".suggestion-title").outerHeight();
         let availableHeight = sheet.height() - headerHeight - 8;
         const maxHeight =
            availableHeight - blockMargins * suggestionBlockMargin;
         interactionsHeight =
            interactionsHeight > maxHeight ? maxHeight : interactionsHeight;
         interactionsElm.css(
            "max-height",
            `calc(${interactionsHeight}px + var(--break-height) + 2px)`
         );
         const collapsedHeight = headerHeight + detailsHeight;
         const expandedHeight = headerHeight + interactionsHeight;
         suggestionElm.data("collapsedHeight", collapsedHeight);
         suggestionElm.data("expandedHeight", expandedHeight);
      }, 250);
      if (newSuggestion) {
         suggestionElm.removeClass("new expanded");
      }
   }
   renderToLogs(sheet, quarterHeight) {
      const suggestionElm = sheet
         .find(".suggestion.template")
         .clone()
         .removeClass("template")
         .attr("id", `preview-suggestion-${this.id}`)
         .attr("data-id", this.id);
      //title - todo: make this dynamic
      suggestionElm
         .find(".suggestion-title")
         .text(this.interactions[0].appName);
      //times
      const timeStartString = this.interactions[0].timeA
         .toString()
         .padStart(4, "0")
         .replace(/(\d{2})(\d{2})/, "$1:$2");
      const timeEndString = this.interactions[
         this.interactions.length - 1
      ].timeB
         .toString()
         .padStart(4, "0")
         .replace(/(\d{2})(\d{2})/, "$1:$2");
      suggestionElm.find(".time-start").text(timeStartString);
      suggestionElm.find(".time-end").text(timeEndString);
      //inject siggestion to sheet
      sheet.append(suggestionElm);

      //move to position
      const startTime = this.interactions[0].timeA;
      const startTimeInMins =
         Math.floor(startTime / 100) * 60 + (startTime % 100);
      const suggestionPosition = (startTimeInMins * quarterHeight) / 15;
      suggestionElm
         .css("transform", `translateY(${suggestionPosition}px)`)
         .attr("position", suggestionPosition);
      //set the height of the suggestion
      const endTime = this.interactions[this.interactions.length - 1].timeB;
      const endTimeInMins = Math.floor(endTime / 100) * 60 + (endTime % 100);
      const suggestionHeight =
         (endTimeInMins * quarterHeight) / 15 - suggestionPosition - 1;
      suggestionElm.css("height", suggestionHeight + "px");
   }
   splitAt(interactionElm) {
      //trim interactions from current suggestion and redefine apps
      const interactionId = interactionElm.attr("data-id");
      const suggestionId = this.id;
      const logsSheet = interactionElm
         .closest(".day")
         .find(".logs-view .timesheet");
      let found = false;
      const trimmedInteractions = [];
      this.apps = [];
      for (let i = this.interactions.length - 1; i >= 0; i--) {
         const interaction = this.interactions[i];
         if (interaction.id == interactionId) {
            found = true;
         }
         if (found) {
            const app = interaction.appName;
            if (!this.apps.includes(app)) {
               this.apps.push(app);
            }
            continue;
         }
         trimmedInteractions.push(interaction);
         this.interactions.pop();
      }
      this.apps.reverse();
      trimmedInteractions.reverse();
      //create new suggestion according to trimmed suggestions
      const newSuggestion = new Suggestion();
      for (const interaction of trimmedInteractions) {
         newSuggestion.interactions.push(interaction);
         if (!newSuggestion.id) {
            newSuggestion.id = interaction.id;
         }
         const app = interaction.appName;
         if (!newSuggestion.apps.includes(app)) {
            newSuggestion.apps.push(app);
         }
      }
      const position = suggestions.findIndex(
         (s) => s.id == $(interactionElm).closest(".suggestion").attr("data-id")
      );
      const sheet = interactionElm.closest(".timesheet");
      const elmCount = sheet.find(".suggestion:not(.template)").length + 1;
      this.renderToSuggestions(sheet, elmCount, position, true);
      suggestions.splice(position + 1, 0, newSuggestion);
      newSuggestion.renderToSuggestions(sheet, elmCount, position, false, true);
      logsSheet.find(`#preview-suggestion-${suggestionId}`).remove();
      this.renderToLogs(logsSheet, quarterHeight);
      newSuggestion.renderToLogs(logsSheet, quarterHeight);
   }
}

$(function () {
   listenersInit();
});

function listenersInit() {
   $(timetable).on("click", timetableClick);

   function timetableClick(e) {
      const target = $(e.target);
      //handle interactions
      let interaction = target;
      if (!interaction.is(".interaction")) {
         interaction = interaction.closest(".interaction");
      }
      if (interaction.length) {
         const suggestion = suggestions.find((s) => {
            const suggestionId = interaction
               .closest(".suggestion")
               .attr("data-id");
            return s.id == suggestionId;
         });
         suggestion.splitAt(interaction);
         return;
      }
      //handle suggestions
      let suggestion = target;
      if (!suggestion.is(".suggestion")) {
         suggestion = suggestion.closest(".suggestion");
      }
      if (suggestion.length) {
         suggestionClick(suggestion);
         return;
      }
   }

   function suggestionClick(suggestion) {
      //make shadow suggestion click original
      if (suggestion.closest(".logs-view").length) {
         const id = suggestion.attr("data-id");
         suggestion = $(`.suggestions-view .suggestion[data-id="${id}"`);
      }
      //expand clicked suggestion
      $(".suggestion.expanded").not(suggestion).removeClass("expanded");
      suggestion.toggleClass("expanded");
      const shadow = $(
         suggestion
            .closest(".day")
            .find(`#preview-suggestion-${suggestion.attr("data-id")}`)
      );
      //scroll suggestion to position;
      const suggestionsContainer = $(suggestion).parent();
      const suggestions = suggestionsContainer.children();
      let pxToScroll =
         (suggestionsContainer.outerHeight() -
            suggestion.data("expandedHeight")) /
         -2;
      for (const s of suggestions) {
         if ($(s).is(suggestion)) {
            break;
         }
         pxToScroll += $(s).data("collapsedHeight") + 8;
      }
      suggestion.parent().animate(
         {
            scrollTop: pxToScroll,
         },
         250
      );
      //scroll shadow to position
      const timesheet = shadow.closest(".timesheet");
      pxToScroll = parseInt(shadow.attr("position"));
      const margin = (timesheet.height() - shadow.outerHeight()) / 2;
      pxToScroll -= margin > 0 ? margin : 0;
      timesheet.animate(
         {
            scrollTop: pxToScroll,
         },
         200
      );
   }
}

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

function renderLogsView(dayElm, dayData) {
   dayElm.find(".logs-view .card-title.long").text(
      dayData.date.toLocaleDateString("default", {
         weekday: "long",
         month: "long",
         day: "numeric",
      })
   );
   dayElm.find(".logs-view .card-title.short").text(
      dayData.date.toLocaleDateString("default", {
         weekday: "short",
         month: "short",
         day: "numeric",
      })
   );
}

function createSuggestions(dayElm, dayData) {
   suggestions = [];
   var suggestion;
   for (const interaction of dayData.interactions) {
      if (interaction.xConfidence <= confidenceLvl) {
         if (suggestion) {
            suggestions.push(suggestion);
         }
         suggestion = new Suggestion();
      }
      suggestion.interactions.push(interaction);
      if (!suggestion.id) {
         suggestion.id = interaction.id;
      }
      const app = interaction.appName;
      if (!suggestion.apps.includes(app)) {
         suggestion.apps.push(app);
      }
   }
   if (suggestion) {
      suggestions.push(suggestion);
   }

   injectSuggestions(dayElm, suggestions);
}

function injectSuggestions(dayElm, suggestions) {
   //prepare suggestions sheet
   const suggestionsTimesheet = dayElm.find(".suggestions-view .timesheet");
   suggestionsTimesheet.empty();

   //prepare logs sheet
   const logsTimesheet = dayElm.find(".logs-view .timesheet");
   quarterHeight = $(logsTimesheet).find(".quarter").outerHeight();
   $(logsTimesheet).scrollTop(quarterHeight * (workDayStart * 4 - 1));

   for (const suggestion of suggestions) {
      suggestion.renderToSuggestions(suggestionsTimesheet, suggestions.length);
      suggestion.renderToLogs(logsTimesheet, quarterHeight);
   }

   injectHoverStyleSheet(suggestions);
}

function injectHoverStyleSheet(suggestions) {
   //create a style sheet for hover effects
   const cssContent = [];
   for (const suggestion of suggestions) {
      cssContent.push(
         `body:has(#suggestion-${suggestion.id}:is(:hover, .expanded)) #preview-suggestion-${suggestion.id}{
            opacity: 1;
            background-position: 100% 0 !important;
            --suggestion-bg-border: var(--suggestion-border-focus);
         }
         
         body:has(#preview-suggestion-${suggestion.id}:hover) #suggestion-${suggestion.id} {
            background-position: 100% 0 !important;
            box-shadow: 0 2px 12px -8px black !important;

            &:not(.expanded) {
               transform: scale(1.015);
            }
         }
         `
      );
   }

   //inject the style sheet into the head
   const styleSheet = $("<style></style>");
   styleSheet.text(cssContent.join("\n"));
   if ($("style#suggestion-hover-styles").length) {
      $("style#suggestion-hover-styles").remove();
   }
   styleSheet.attr("id", "suggestion-hover-styles");
   $("head").append(styleSheet);
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
      createSuggestions(dayElement, dayData);
   }

   async function fetchDayData(day) {
      //check if the day is already loaded
      if (loadedDays.has(day.toDateString())) {
         currentDay = loadedDays.get(day.toDateString());
         return currentDay;
      }

      //fetch the suggestions and logs for the day
      const logs = await fetchLogs();
      const interactions = await fetchInteractions();
      currentDay = new Day(day, logs);
      currentDay.interactions = interactions;
      loadedDays.set(day.toDateString(), currentDay);
      return currentDay;

      async function fetchLogs() {
         //this is a temporary local solution
         //this is where you would fetch the logs data from the server
         return [];
      }

      async function fetchInteractions() {
         //this is a temporary local solution
         //this is where you would fetch the interactions data from the server
         return fetch("./interactions/day1.json")
            .then((response) => response.json())
            .then((data) => {
               const dayInteractions = data.workDay;
               return dayInteractions;
            })
            .catch((error) => {
               return [];
            });
      }
   }
}

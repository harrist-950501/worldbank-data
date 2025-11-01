/*
 * Name: Harry Cheng
 * Date: 10/28/2025
 * Section: CSE 154 AA
 * This is the JS file that runs the data graphing tool.
 * It has the following features:
 *   sets up two line charts (Population and GDP) from the World Bank API
 *   allows users to choose a country to fetch data for
 *   compares data in two charts with distinct colors
 *   reset button to clear the two charts
 *   trigger reminder when fetch fails or charts excess maximum lines
 *   loads all country list (but the country might not support data fetching)
 */

"use strict";
(function() {
  const BASE_URL = "https://api.worldbank.org/v2";

  // Date for world bank data search
  const YEAR_START = 2020;
  const YEAR_END = 2023;

  // Indicator code for world bank data search
  const POPULATION_INDICATOR = "SP.POP.TOTL";
  const GDP_INDICATOR = "NY.GDP.MKTP.CD";
  const AVERAGE_POPULATION_INDICATOR = "SP.POP.GROW";
  const AVERAGE_GDP_INDICATOR = "NY.GDP.MKTP.KD.ZG";

  window.addEventListener("load", init);

  function init() {
    qs("#controller form").addEventListener("submit", eventObject => {
      eventObject.preventDefault();
      countryDataFetch();
    });
    id("reset-btn").addEventListener("click", eventObject => {
      eventObject.preventDefault();
      id("country-card-board").innerHTML = "";
    });
    id("country-select").addEventListener("change", isOtherSelected);
  }

  function isOtherSelected() {
    if (this.value === "other") {
      this.removeChild(this.lastElementChild);
      countrySelectFetch();
    }
  }

<<<<<<< HEAD
  function resetBoard() {
    popChart.data.datasets = [];
    popChart.update();

    gdpChart.data.datasets = [];
    gdpChart.update();

    let genBtn = id("generate-btn");
    if (genBtn.disabled) {
      id("generate-btn").disabled = false;
      qs("#controller p").classList.add("hidden");
    }
    colorIndex = 0;
  }

  function chartSetUp() {
    let years = Array.from({length: END_YEAR - START_YEAR + 1}, (__, i) => START_YEAR + i);

    let popCanvas = id("population-chart");
    popChart = new Chart(popCanvas, {
      type: "line",
      data: {labels: years, datasets: []},
      options: {
        scales: {
          x: {title: {display: true, text: "Year"}},
          y: {title: {display: true, text: "Population"}}
        },
        plugins: {title: {display: true, text: "Population chart"}}
      }
    });

    let gdpCanvas = id("gdp-chart");
    gdpChart = new Chart(gdpCanvas, {
      type: "line",
      data: {labels: years, datasets: []},
      options: {
        scales: {
          x: {title: {display: true, text: "Year"}},
          y: {title: {display: true, text: "GDP (current US$)"}}
        },
        plugins: {title: {display: true, text: "GDP chart"}}
      }
    });
  }

=======
>>>>>>> 547c49572918058de6fc3c5a6be17c3c489341a2
  function apiFetch(url, handler) {
    fetch(url)
      .then(statusCheck)
      .then(res => res.json())
      .then(handler)
      .then(hideErrorPage)
      .catch(errorHandler);
  }

  function hideErrorPage() {
    id("error-page").classList.add("hidden");
  }

  function errorHandler() {
    id("error-page").classList.remove("hidden");
  }

  function countrySelectFetch() {
    let url = BASE_URL + "/country?format=json&per_page=400";
    apiFetch(url, countrySelectFill);
  }

  function countrySelectFill(countries) {
    let select = id("country-select");
    let existOption = new Set();
    let options = select.options;

    for (let i = 0; i < options.length; i++) {
      existOption.add(options[i].value);
    }

    for (let i = 0; i < countries[0].total; i++) {
      let country = countries[1][i];
      if (!existOption.has(country.iso2Code)) {
        let option = gen("option");
        option.textContent = country.name;
        option.value = country.iso2Code;
        select.appendChild(option);
      }
    }

  }

  function countryDataFetch() {
    let country = id("country-select").value;

    let countryUrl = BASE_URL + "/" + country + "?format=json";
    let popUrl = BASE_URL +
      "/country/" + country +
      "/indicator/" + POPULATION_INDICATOR +
      "?date=" + YEAR_END +
      "&format=json";
    let gdpUrl = BASE_URL +
      "/country/" + country +
      "/indicator/" + GDP_INDICATOR +
      "?date=" + YEAR_END +
      "&format=json";
    let avgPopUrl = BASE_URL +
      "/country/" + country +
      "/indicator/" + AVERAGE_POPULATION_INDICATOR +
      "?date=" + YEAR_START + ":" + YEAR_END +
      "&format=json";
    let avgGdpUrl = BASE_URL +
      "/country/" + country +
      "/indicator/" + AVERAGE_GDP_INDICATOR +
      "?date=" + YEAR_START + ":" + YEAR_END +
      "&format=json";

      Promise.all()
      makeCountryCard();

<<<<<<< HEAD
    apiFetch(popUrl, data => updateChart(popChart, data, color));
    apiFetch(gdpUrl, data => updateChart(gdpChart, data, color));
  }

  function updateChart(chart, data, color) {
    let rows = data[1];
    const countryName = rows[0].country.value;
    let values = rows.map(row => row.value).reverse();

    let lineExist = chart.data.datasets.find(dataset => dataset.label === countryName);

    if (!lineExist) {
      chart.data.datasets.push({
        label: countryName,
        data: values,
        borderColor: color,
        backgroundColor: color + "33", // 半透明背景
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#FFFFFF"
      });
    }

    chart.update();

    isChartLineOver(chart.data.datasets.length);
  }

  function isChartLineOver(length) {
    if (length === COLORS.length) {
      id("generate-btn").disabled = true;
      qs("#controller p").classList.remove("hidden");
    }
=======
    apiFetch(popUrl, data => updateChart(data, color));
    apiFetch(gdpUrl, data => updateChart(data, color));
    apiFetch(avgPopUrl, data => updateChart(data, color));
    apiFetch(avgGdpUrl, data => updateChart(data, color));
>>>>>>> 547c49572918058de6fc3c5a6be17c3c489341a2
  }

  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} res - response to check for success/error
   * @return {object} - valid response if response was successful, otherwise rejected
   *                    Promise result
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} id - element ID.
   * @returns {object} - DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Returns first element matching selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} - DOM object associated selector.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns a element with the given tagname.
   * @param {string} tagname - HTML element tagname
   * @returns {HTMLElement} a HTML element that hasn't bind with DOM yet.
   */
  function gen(tagname) {
    return document.createElement(tagname);
  }
})();
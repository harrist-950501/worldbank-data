/*
 * Name: Harry Cheng
 * Date: 03/31/2026
 * Description: Behavior for the World Bank data explorer with chart and card views.
 */

"use strict";
(function() {
  const BASE_URL = "https://api.worldbank.org/v2";

  const CHART_START_YEAR = 2004;
  const CARD_START_YEAR = 2020;
  const END_YEAR = 2023;

  const POPULATION_INDICATOR = "SP.POP.TOTL";
  const GDP_INDICATOR = "NY.GDP.MKTP.CD";
  const POPULATION_GROW_INDICATOR = "SP.POP.GROW";
  const GDP_GROW_INDICATOR = "NY.GDP.MKTP.KD.ZG";

  const POP_GROW_ROUND = 1000;
  const GDP_GROW_ROUND = 100;

  const POSITIVE_RATE = 0.5;
  const NEGATIVE_RATE = -0.5;

  const COLORS = ["#00A6CF", "#6A4C93", "#E76F51", "#2A9D8F", "#F4A261",
    "#264653", "#D62828"];

  let popChart;
  let gdpChart;
  let colorIndex = 0;

  window.addEventListener("load", init);

  /**
   * Initializes the page with charts and shared event listeners.
   */
  function init() {
    chartSetUp();
    viewChange();

    id("generate-btn").addEventListener("click", eventObject => {
      eventObject.preventDefault();
      hideErrorPage();

      if (id("view-select").value === "chart") {
        chartDataFetch();
      } else {
        cardDataFetch();
      }
    });

    id("reset-btn").addEventListener("click", eventObject => {
      eventObject.preventDefault();

      if (id("view-select").value === "chart") {
        resetBoard();
      } else {
        id("country-card-board").innerHTML = "";
      }

      hideErrorPage();
    });

    id("country-select").addEventListener("change", isOtherSelected);
    id("view-select").addEventListener("change", viewChange);
  }

  /**
   * Switches between chart mode and card mode displays.
   */
  function viewChange() {
    if (id("view-select").value === "chart") {
      id("chart-section").classList.remove("hidden");
      id("card-section").classList.add("hidden");

      if (popChart.data.datasets.length === COLORS.length) {
        id("generate-btn").disabled = true;
        id("chart-limit-message").classList.remove("hidden");
      } else {
        id("generate-btn").disabled = false;
        id("chart-limit-message").classList.add("hidden");
      }
    } else {
      id("chart-section").classList.add("hidden");
      id("card-section").classList.remove("hidden");
      id("generate-btn").disabled = false;
      id("chart-limit-message").classList.add("hidden");
    }
  }

  /**
   * Checks whether "Other..." was selected and loads more economies or regions.
   */
  function isOtherSelected() {
    if (this.value === "other") {
      this.removeChild(this.lastElementChild);
      countrySelectFetch();
    }
  }

  /**
   * Clears both charts and resets chart mode state.
   */
  function resetBoard() {
    popChart.data.datasets = [];
    popChart.update();

    gdpChart.data.datasets = [];
    gdpChart.update();

    if (id("generate-btn").disabled) {
      id("generate-btn").disabled = false;
      id("chart-limit-message").classList.add("hidden");
      colorIndex = 0;
    }
  }

  /**
   * Sets up the population and GDP charts.
   */
  function chartSetUp() {
    let years = Array.from(
      {length: END_YEAR - CHART_START_YEAR + 1},
      (_, i) => CHART_START_YEAR + i
    );

    let popCanvas = id("population-chart");
    popChart = new Chart(popCanvas, {
      type: "line",
      data: {
        labels: years,
        datasets: []
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: "Year"
            }
          },
          y: {
            title: {
              display: true,
              text: "Population"
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: "Population chart"
          }
        }
      }
    });

    let gdpCanvas = id("gdp-chart");
    gdpChart = new Chart(gdpCanvas, {
      type: "line",
      data: {
        labels: years,
        datasets: []
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: "Year"
            }
          },
          y: {
            title: {
              display: true,
              text: "GDP (current US$)"
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: "GDP chart"
          }
        }
      }
    });
  }

  /**
   * Fetches the full list of economies and regions.
   */
  function countrySelectFetch() {
    let url = BASE_URL + "/country?format=json&per_page=400";
    apiFetch(url).then(countrySelectFill);
  }

  /**
   * Fills the select menu with fetched economies and regions.
   * @param {object} countries - fetched World Bank country data.
   */
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

  /**
   * Fetches data for chart mode and updates both charts.
   */
  function chartDataFetch() {
    let economy = id("country-select").value;
    let popUrl = BASE_URL + "/country/" + economy + "/indicator/" +
      POPULATION_INDICATOR + "?date=" + CHART_START_YEAR + ":" + END_YEAR + "&format=json";
    let gdpUrl = BASE_URL + "/country/" + economy + "/indicator/" +
      GDP_INDICATOR + "?date=" + CHART_START_YEAR + ":" + END_YEAR + "&format=json";
    let color = COLORS[colorIndex];

    Promise.all([apiFetch(popUrl), apiFetch(gdpUrl)])
      .then(([popData, gdpData]) => {
        updateChart(popChart, popData, color);
        updateChart(gdpChart, gdpData, color);
        colorIndex++;
      })
      .catch(() => errorHandler("Something goes wrong in chart generating!!"));
  }

  /**
   * Adds one economy or region dataset to the given chart.
   * @param {object} chart - the Chart.js chart to update.
   * @param {object} data - fetched indicator data.
   * @param {string} color - line color for the dataset.
   */
  function updateChart(chart, data, color) {
    let rows = data[1];
    let economyName = rows[0].country.value;
    let values = rows.map(row => row.value).reverse();
    let lineExist = chart.data.datasets.find(dataset => dataset.label === economyName);

    if (!lineExist) {
      chart.data.datasets.push({
        label: economyName,
        data: values,
        borderColor: color,
        backgroundColor: color + "33",
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

  /**
   * Disables chart generation when the maximum number of lines is reached.
   * @param {number} length - current number of chart datasets.
   */
  function isChartLineOver(length) {
    if (length === COLORS.length) {
      id("generate-btn").disabled = true;
      id("chart-limit-message").classList.remove("hidden");
    }
  }

  /**
   * Fetches all data needed to build one information card.
   */
  function cardDataFetch() {
    let economy = id("country-select").value;
    let cards = qsa(".country-card");

    if (!isCardExist(cards, economy)) {
      let countryUrl = BASE_URL + "/country/" + economy + "?format=json";
      let popUrl = BASE_URL + "/country/" + economy + "/indicator/" + POPULATION_INDICATOR +
        "?date=" + END_YEAR + "&format=json";
      let gdpUrl = BASE_URL + "/country/" + economy + "/indicator/" + GDP_INDICATOR +
        "?date=" + END_YEAR + "&format=json";
      let popGrowUrl = BASE_URL + "/country/" + economy + "/indicator/" +
        POPULATION_GROW_INDICATOR + "?date=" + CARD_START_YEAR + ":" + END_YEAR +
        "&format=json";
      let gdpGrowUrl = BASE_URL + "/country/" + economy + "/indicator/" +
        GDP_GROW_INDICATOR + "?date=" + CARD_START_YEAR + ":" + END_YEAR + "&format=json";

      Promise.all([
        apiFetch(countryUrl),
        apiFetch(popUrl),
        apiFetch(gdpUrl),
        apiFetch(popGrowUrl),
        apiFetch(gdpGrowUrl)
      ])
        .then(([countryData, popData, gdpData, avgPopData, avgGdpData]) => {
          cardSetup(countryData, popData, gdpData, avgPopData, avgGdpData);
        })
        .catch(() => errorHandler("Something goes wrong in card generating!!"));
    } else {
      errorHandler("The card is already there, try another one!!");
    }
  }

  /**
   * Builds and appends one information card.
   * @param {object} countryData - fetched economy or region metadata.
   * @param {object} popData - fetched population data.
   * @param {object} gdpData - fetched GDP data.
   * @param {object} avgPopData - fetched population growth data.
   * @param {object} avgGdpData - fetched GDP growth data.
   */
  function cardSetup(countryData, popData, gdpData, avgPopData, avgGdpData) {
    let card = gen("article");
    card.classList.add("country-card");
    card.id = countryData[1][0].iso2Code;

    headerSetup(card, countryData);
    popRowSetup(card, popData);
    gdpRowSetup(card, gdpData);
    avgGdpRowSetup(card, popData, gdpData);
    avgPopGrowthRowSetup(card, avgPopData);
    avgGdpGrowthRowSetup(card, avgGdpData);

    id("country-card-board").appendChild(card);
  }

  /**
   * Checks whether a card already exists for the selected economy or region.
   * @param {NodeList} cards - existing card elements.
   * @param {string} country - selected economy or region code.
   * @returns {boolean} true if the card already exists, false otherwise.
   */
  function isCardExist(cards, country) {
    for (let card of cards) {
      if (card.id === country) {
        return true;
      }
    }
    return false;
  }

  /**
   * Adds the header row to a card.
   * @param {HTMLElement} card - card element being built.
   * @param {object} data - fetched economy or region metadata.
   */
  function headerSetup(card, data) {
    let country = data[1][0];
    let name = country.name;
    let income = country.incomeLevel.value;

    if (income === "High income") {
      card.classList.add("high-income");
    } else if (income === "Upper middle income") {
      card.classList.add("upper-income");
    } else if (income === "Lower middle income") {
      card.classList.add("lower-income");
    } else {
      card.classList.add("low-income");
    }

    let header = gen("header");
    let title = gen("h3");
    title.textContent = name;

    let paragraph = gen("p");
    paragraph.textContent = income;

    header.appendChild(title);
    header.appendChild(paragraph);
    card.appendChild(header);
  }

  /**
   * Adds the population row to a card.
   * @param {HTMLElement} card - card element being built.
   * @param {object} data - fetched population data.
   */
  function popRowSetup(card, data) {
    let pop = data[1][0].value;

    let paragraph = gen("p");
    paragraph.classList.add("card-row");

    let label = gen("span");
    label.classList.add("label");
    label.textContent = "Population (" + END_YEAR + "):";

    let value = gen("span");
    value.classList.add("value");
    value.textContent = pop;

    paragraph.appendChild(label);
    paragraph.appendChild(value);
    card.appendChild(paragraph);
  }

  /**
   * Adds the GDP row to a card.
   * @param {HTMLElement} card - card element being built.
   * @param {object} data - fetched GDP data.
   */
  function gdpRowSetup(card, data) {
    let gdp = Math.floor(data[1][0].value);

    let paragraph = gen("p");
    paragraph.classList.add("card-row");

    let label = gen("span");
    label.classList.add("label");
    label.textContent = "GDP (" + END_YEAR + "):";

    let value = gen("span");
    value.classList.add("value");
    value.textContent = "$" + gdp;

    paragraph.appendChild(label);
    paragraph.appendChild(value);
    card.appendChild(paragraph);
  }

  /**
   * Adds the GDP per capita row to a card.
   * @param {HTMLElement} card - card element being built.
   * @param {object} popData - fetched population data.
   * @param {object} gdpData - fetched GDP data.
   */
  function avgGdpRowSetup(card, popData, gdpData) {
    let pop = popData[1][0].value;
    let gdp = Math.floor(gdpData[1][0].value);
    let avgGdp = Math.floor(gdp / pop);

    let paragraph = gen("p");
    paragraph.classList.add("card-row");

    let label = gen("span");
    label.classList.add("label");
    label.textContent = "GDP per capita";

    let value = gen("span");
    value.classList.add("value");
    value.textContent = "$" + avgGdp;

    paragraph.appendChild(label);
    paragraph.appendChild(value);
    card.appendChild(paragraph);
  }

  /**
   * Adds the average population growth row to a card.
   * @param {HTMLElement} card - card element being built.
   * @param {object} data - fetched population growth data.
   */
  function avgPopGrowthRowSetup(card, data) {
    let popGrow = data[1];
    let avgPopGrowth = 0;

    for (let i = 0; i < popGrow.length; i++) {
      avgPopGrowth += popGrow[i].value;
    }
    avgPopGrowth = Math.floor(avgPopGrowth / popGrow.length * POP_GROW_ROUND) / POP_GROW_ROUND;

    let paragraph = gen("p");
    paragraph.classList.add("card-row");

    let label = gen("span");
    label.classList.add("label");
    label.textContent = "Average population growth";

    let value = gen("span");
    value.classList.add("value");
    value.classList.add(checkGrowthLevel(avgPopGrowth));
    value.textContent = avgPopGrowth + "%";

    paragraph.appendChild(label);
    paragraph.appendChild(value);
    card.appendChild(paragraph);
  }

  /**
   * Adds the average GDP growth row to a card.
   * @param {HTMLElement} card - card element being built.
   * @param {object} data - fetched GDP growth data.
   */
  function avgGdpGrowthRowSetup(card, data) {
    let gdpGrow = data[1];
    let avgGdpGrowth = 0;

    for (let i = 0; i < gdpGrow.length; i++) {
      avgGdpGrowth += gdpGrow[i].value;
    }
    avgGdpGrowth = Math.floor(avgGdpGrowth / gdpGrow.length * GDP_GROW_ROUND) / GDP_GROW_ROUND;

    let paragraph = gen("p");
    paragraph.classList.add("card-row");

    let label = gen("span");
    label.classList.add("label");
    label.textContent = "Average GDP growth";

    let value = gen("span");
    value.classList.add("value");
    value.classList.add(checkGrowthLevel(avgGdpGrowth));
    value.textContent = avgGdpGrowth + "%";

    paragraph.appendChild(label);
    paragraph.appendChild(value);
    card.appendChild(paragraph);
  }

  /**
   * Returns the growth class name for a given growth rate.
   * @param {number} growth - growth rate to evaluate.
   * @returns {string} CSS class name for the growth level.
   */
  function checkGrowthLevel(growth) {
    if (growth >= POSITIVE_RATE) {
      return "positive";
    } else if (growth <= NEGATIVE_RATE) {
      return "negative";
    }
    return "neutral";
  }

  /**
   * Fetches data from the World Bank API and returns parsed JSON.
   * @param {string} url - the URL to fetch.
   * @returns {Promise<object>} parsed JSON data from the response.
   */
  function apiFetch(url) {
    return fetch(url)
      .then(statusCheck)
      .then(res => res.json())
      .then(data => {
        hideErrorPage();
        return data;
      })
      .catch(() => {
        errorHandler("Opps! The economy or region has no record.");
        throw new Error("Fetch failed");
      });
  }

  /**
   * Hides the shared error message.
   */
  function hideErrorPage() {
    id("error-message").classList.add("hidden");
  }

  /**
   * Shows the shared error message.
   * @param {string} message - the message to display.
   */
  function errorHandler(message) {
    let errorPage = id("error-message");
    errorPage.textContent = message;
    errorPage.classList.remove("hidden");
  }

  /**
   * Checks whether a fetch response is successful.
   * @param {object} res - fetch response object.
   * @returns {Promise<object>} the original response if successful.
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Returns the element with the given ID.
   * @param {string} id - element ID.
   * @returns {HTMLElement} matching DOM element.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Returns all elements matching the selector.
   * @param {string} query - CSS selector string.
   * @returns {NodeList} matching DOM elements.
   */
  function qsa(query) {
    return document.querySelectorAll(query);
  }

  /**
   * Creates a new element with the given tag name.
   * @param {string} tagname - HTML tag name.
   * @returns {HTMLElement} newly created element.
   */
  function gen(tagname) {
    return document.createElement(tagname);
  }
})();

/*
 * Name: Harry Cheng
 * Date: 10/28/2025
 * Section: CSE 154 AA
 *
 * This is the JS file that runs the country info-card generator.
 * It has the following features:
 *   generate a info-card with specified country/region
 *   reset button to clear the info-card board
 *   pick from a larger range of countries/regions (Other...)
 *   error handling
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
  const POPULATION_GROW_INDICATOR = "SP.POP.GROW";
  const GDP_GROW_INDICATOR = "NY.GDP.MKTP.KD.ZG";

  // Growth rate rounding
  const POP_GEOW_ROUND = 1000;
  const GDP_GEOW_ROUND = 100;

  // Growth rate level
  const POSITIVE_RATE = 0.5;
  const NEGATIVE_RATE = -0.5;

  window.addEventListener("load", init);

  /**
   * Initialize the card generator.
   * Call corresponding function for generate, reset when getting click.
   * Also call corresponding function when the country select list is change.
   */
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

  /**
   * Check if the option "Other..." is selected. If so, calls in the country fecthing function.
   */
  function isOtherSelected() {
    if (this.value === "other") {
      this.removeChild(this.lastElementChild);
      countrySelectFetch();
    }
  }

  /**
   * Fetching data from World bank api
   * @param {boolean} url - the url for data fetching
   * @return {object} - valid response if response was successful, otherwise rejected
   *                    Promise result
  */
  function apiFetch(url) {
    return fetch(url)
      .then(statusCheck)
      .then(res => res.json())
      .then(data => {
        hideErrorPage();
        return data;
      })
      .catch(() => errorHandler("Opps! The country has no record. Unsecussful fetching"));
  }

  /**
   * Hide the error page
  */
  function hideErrorPage() {
    id("error-page").classList.add("hidden");
  }

  /**
   * Show the error page
   * @param {String} message - the error message to be displayed
  */
  function errorHandler(message) {
    let errorPage = id("error-page");
    errorPage.textContent = message;
    errorPage.classList.remove("hidden");
  }

  /**
   * Fetch all the country and call in the list filltor
  */
  function countrySelectFetch() {
    let url = BASE_URL + "/country?format=json&per_page=400";
    apiFetch(url).then(countrySelectFill)
  }

  /**
   * The list filltor, no repeated country/region
   * @param {FetchJson} countries - the json of country-fetching
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
   * Fetch all the data for a country info-card.
  */
  function countryDataFetch() {
    let country = id("country-select").value;

    let cards = qsa(".country-card");
    if (!isCardExist(cards, country)) {
      let countryUrl = BASE_URL + "/country/" + country + "?format=json";
      let popUrl = BASE_URL + "/country/" + country + "/indicator/" + POPULATION_INDICATOR +
        "?date=" + YEAR_END + "&format=json";
      let gdpUrl = BASE_URL + "/country/" + country + "/indicator/" + GDP_INDICATOR +
        "?date=" + YEAR_END + "&format=json";
      let popGrowUrl = BASE_URL + "/country/" + country + "/indicator/" +
        POPULATION_GROW_INDICATOR + "?date=" + YEAR_START + ":" + YEAR_END + "&format=json";
      let agdpGrowUrl = BASE_URL + "/country/" + country + "/indicator/" + GDP_GROW_INDICATOR +
        "?date=" + YEAR_START + ":" + YEAR_END + "&format=json";

      Promise.all([
        apiFetch(countryUrl),
        apiFetch(popUrl),
        apiFetch(gdpUrl),
        apiFetch(popGrowUrl),
        apiFetch(agdpGrowUrl)
      ])
        .then(([countryData, popData, gdpData, avgPopData, avgGdpData]) => {
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
        })
        .then(hideErrorPage)
        .catch(() => errorHandler("Something goes wrong in card generating!!"));
    } else {
      errorHandler("The card is already there, try another one!!");
    }
  }

  /**
   * Check if there are reapted card
   * @param {DOMlist} cards - all the exsiting cards
   * @param {String} country - the country to be checked
   * @return {boolean} -ture if repeatness found, false otherwise
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
   * Card header setup
   * @param {DOMelement} card -the card to be added in
   * @param {FetchArray} data - the correspongding fetch data
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
   * Card population row setup
   * @param {DOMelement} card -the card to be added in
   * @param {FetchArray} data - the correspongding fetch data
  */
  function popRowSetup(card, data) {
    let pop = data[1][0].value;

    let paragraph = gen("p");
    paragraph.classList.add("card-row");

    let label = gen("span");
    label.classList.add("label");
    label.textContent = "Population (" + YEAR_END + "):";

    let value = gen("span");
    value.classList.add("value");
    value.textContent = pop;

    paragraph.appendChild(label);
    paragraph.appendChild(value);
    card.appendChild(paragraph);
  }

  /**
   * Card population row setup
   * @param {DOMelement} card -the card to be added in
   * @param {FetchArray} data - the correspongding fetch data
  */
  function gdpRowSetup(card, data) {
    let gdp = Math.floor(data[1][0].value);

    let paragraph = gen("p");
    paragraph.classList.add("card-row");

    let label = gen("span");
    label.classList.add("label");
    label.textContent = "GDP (" + YEAR_END + "):";

    let value = gen("span");
    value.classList.add("value");
    value.textContent = "$" + gdp;

    paragraph.appendChild(label);
    paragraph.appendChild(value);
    card.appendChild(paragraph);
  }

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

  function avgPopGrowthRowSetup(card, data) {
    let popGrow = data[1];
    let avgPopGrowth = 0;
    for (let i = 0; i < popGrow.length; i++) {
      avgPopGrowth += popGrow[i].value;
    }
    avgPopGrowth = Math.floor(avgPopGrowth / popGrow.length * POP_GEOW_ROUND) / POP_GEOW_ROUND;

    let paragraph = gen("p");
    paragraph.classList.add("card-row");
    paragraph.classList.add("growth");

    let label = gen("span");
    label.classList.add("label");
    label.textContent = "Average population growth";

    let value = gen("span");
    value.classList.add("value");
    let growthLevel = checkGrowthLevel(avgPopGrowth);
    value.classList.add(growthLevel);
    value.textContent = avgPopGrowth + "%";

    paragraph.appendChild(label);
    paragraph.appendChild(value);
    card.appendChild(paragraph);
  }

  function avgGdpGrowthRowSetup(card, data) {
    let gdpGrow = data[1];
    let avgGdpGrowth = 0;
    for (let i = 0; i < gdpGrow.length; i++) {
      avgGdpGrowth += gdpGrow[i].value;
    }
    avgGdpGrowth = Math.floor(avgGdpGrowth / gdpGrow.length * GDP_GEOW_ROUND) / GDP_GEOW_ROUND;

    let paragraph = gen("p");
    paragraph.classList.add("card-row");
    paragraph.classList.add("growth");

    let label = gen("span");
    label.classList.add("label");
    label.textContent = "Average gdp growth";

    let value = gen("span");
    value.classList.add("value");
    let growthLevel = checkGrowthLevel(avgGdpGrowth);
    value.classList.add(growthLevel);
    value.textContent = avgGdpGrowth + "%";

    paragraph.appendChild(label);
    paragraph.appendChild(value);
    card.appendChild(paragraph);
  }

  function checkGrowthLevel(growth) {
    if (growth >= POSITIVE_RATE) {
      return "positive";
    } else if (growth <= NEGATIVE_RATE) {
      return "negative";
    }
    return "neutral";
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
   * Returns the array of elements that match the given CSS selector.
   * @param {string} query - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(query) {
    return document.querySelectorAll(query);
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
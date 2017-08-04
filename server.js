// const express = require('express');
const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const json2csv = require('json2csv');
const _ = require('lodash');
// const app = express();

// All the web scraping magic will happen here
//const url = 'http://www.champ-sys.com.au/custom/tech-long-sleeve-jersey.html';

const masterUrl = 'http://www.champ-sys.com.au/custom';

const childUrl = [];

const getAllChildUrl = (url) => {
  request(url, (error, response, html) => {
    if(!error) {
      const $ = cheerio.load(html);
      $('.products-grid > li > a').each((i, el) => {
        childUrl.push($(el).attr('href'));
      });
    }
    console.log(childUrl);
  });
}


function translateToCsv(json, fileName) {
  const newJson = {
    productUrl: json.productUrl,
    productName: json.productName,
    description: json.description,
    price: json.price,
  };
  const csv = json2csv(newJson);
  fs.writeFile(fileName, csv, (err) => {
    if (err) throw err;
    console.log('file saved');
  });
}

function translateToCsvImage(json) {
  return _.each(json.imageUrls, (value) => {
    return json2csv({ productUrl: json.productUrl, imageUrl: value });
  });
}

function getSingleProductCallBack(tempUrl) {
  request(tempUrl, (error, response, html) => {
    const json = { productUrl: '', productName: '', description: '', imageUrls: [], price: ''};
    if (!error) {
      const $ = cheerio.load(html);
      json.productUrl = tempUrl;
      json.productName = $('.product-name > h1').text();
      json.description = $('.product-shop > .description').text();
      /*
      $('.slider > li > a').each((i, el) => {
        json.imageUrls[i] = $(el).attr('href');
      });
      */

    }
    console.log(json);
    return json;
  });
}


console.log('start scraping');

//prepare the tree
getAllChildUrl(masterUrl);
//for the tree, scrape

// and save to file




// exports = module.exports = app;

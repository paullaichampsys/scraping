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
const trimUrltoProduct = (tempUrl) => {
  const firstPos = tempUrl.lastIndexOf('/') + 1;
  const lastPos = tempUrl.lastIndexOf('.');
  return tempUrl.slice(firstPos, lastPos);
}
function getSingleProductCallBack(tempUrl) {
  request('http://www.champ-sys.com.au/custom/tech-lite-polo-shirt-30638.html', (error, response, html) => {
    const json = { };
    if (!error) {
      const $ = cheerio.load(html);
      json.productUrl = tempUrl;
      json.uniqueName = trimUrltoProduct(tempUrl);
      json.productName = $('.product-name > h1').html();
      json.description = $('.product-shop > .description').html();
      /*
      $('.slider > li > a').each((i, el) => {
        json.imageUrls[i] = $(el).attr('href');
      });
      */

    }
    console.log(json2csv(json));
    //return json;
  });
}

function recursivegetChildUrl(url) {
  request(url, (error, response, html) => {
    // first get all the url
    console.log('now scrape', url);
    if (!error) {
      const $ = cheerio.load(html);
      $('.products-grid > li > a').each((i, el) => {
        childUrl.push($(el).attr('href'));
      });
      const nextUrl = $('.i-next').attr('href');
      if (nextUrl !== undefined) {
        recursivegetChildUrl(nextUrl);
      } else {
        console.log('Start the single product scraping');
        _.each(childUrl, (value) => {
          getSingleProductCallBack(value);
        });
      }
    } else {
      console.log(error);
    }
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


console.log('start scraping');

//prepare the tree
//recursivegetChildUrl(masterUrl);
//for the tree, scrape
// and save to file
getSingleProductCallBack('http://www.champ-sys.com.au/custom/tech-lite-polo-shirt-30638.html');




// exports = module.exports = app;

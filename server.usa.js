const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');

// All the web scraping magic will happen here
//const productFileName = 'shopReadyToWear.csv';
//const imageFileName = 'shopReadyToWearImage.csv';
//const masterUrl = 'http://www.champ-sys.com.au/retail';
const productFileName = 'usa-2.csv';
const imageFileName = 'usaImage-2.csv';
const masterUrl = 'http://champ-sys.com/retail';

const trimUrltoProduct = (tempUrl) => {
  const firstPos = tempUrl.lastIndexOf('/') + 1;
  const lastPos = tempUrl.lastIndexOf('.');
  return tempUrl.slice(firstPos, lastPos);
}

// fail control
let imageErrCounter = 0;
let requestErrCounter = 0;
let itemCounter = 0;

const trimExtraNextLine = (str) => {
  if (str === undefined || str === null || str === '') {
    return '';
  }
  let tempStr = str.replace(/\\n/g, '');
  tempStr = tempStr.replace(/\n/g, '');
  tempStr = tempStr.replace('\\n', '');
  tempStr = tempStr.replace(/["]/g, "'");
  tempStr = tempStr.replace('  ', ' ');
  return tempStr.trim();
}

const writeProductCsv = function _writeToFileCsv(json) {
  const str = `"${json.productName}",${json.productUrl},${json.uniqueName},"${json.description}","${json.description2}",${json.price}\n`;
  fs.appendFile(productFileName, str);
}

const writeProductImgCsv = function _writeProductImgCsv(json) {
  let str = '';
  json.imageUrls.forEach((currentValue) => {
    str = `${str}${json.uniqueName},${currentValue}\n`;
  });
  fs.appendFile(imageFileName, str);
}

function getSingleProductCallBack(tempUrl) {
  request(tempUrl, (error, response, html) => {
    const json = { };
    if (!error) {
      const $ = cheerio.load(html);
      json.productUrl = tempUrl;
      json.uniqueName = trimUrltoProduct(tempUrl);
      json.productName = $('.product-name > h1').html();
      json.description = trimExtraNextLine($('div.product-collateral > div.box-collateral.box-description > div.box-collateral-content > div.std').html());
      json.description2 = trimExtraNextLine($('div.product-shop > div.short-description > div.std').html());
      json.price = $('.product-shop > .price-box > .regular-price > span.price').text();
      json.imageUrls = [];
      try {
        $('div.container-slider > ul.slider > li > a').each((i, el) => {
          json.imageUrls.push($(el).attr('href'));
        });
      } catch (imgerror) {
        console.log('image Error');
        imageErrCounter += 1;
      }
      itemCounter += 1;
      console.log('success', itemCounter, json.productUrl);
      writeProductCsv(json);
      writeProductImgCsv(json);
    } else {
      console.log('error', error);
      requestErrCounter += 1;
    }
  });
}

function recursivegetChildUrl(url) {
  request(url, (error, response, html) => {
    // first get all the url
    console.log('now scrape', url);
    if (!error) {
      const $ = cheerio.load(html);
      $('.products-grid > li > a').each((i, el) => {
        const href = $(el).attr('href');
        // Do the scraping here
        getSingleProductCallBack(href);
      });
      const nextUrl = $('.i-next').attr('href');
      if (nextUrl !== undefined) {
        recursivegetChildUrl(nextUrl);
      }
    } else {
      console.log(error);
      requestErrCounter += 1;
    }
  });
  console.log('Image error: ', imageErrCounter);
  console.log('Request Error: ', requestErrCounter);
}

console.log('start scraping');

//start the scraping
recursivegetChildUrl(masterUrl);

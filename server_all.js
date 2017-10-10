const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const _ = require('lodash');

const prefix = 'Spain2';
const mainUrl = 'http://cs-es-p.bcnetcom.com';
const scrapingLevel = 'custom';
const pathAry = [];

// All the web scraping magic will happen here

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
  let tempStr = _.replace(str, /\n/g, '');
  tempStr = _.replace(tempStr, /["]/g, "'");
  tempStr = _.replace(tempStr, '  ', ' ');
  return _.trim(tempStr);
}

const trimEuroSign = str => (_.replace(str, /€/, ''));


const writeProductCsv = function _writeToFileCsv(json, productFileName) {
  const str = `"${json.productName}",${json.productUrl},${json.uniqueName},"${json.description}",${json.price}\n`;
  fs.appendFile(productFileName, str);
}

const writeProductImgCsv = function _writeProductImgCsv(json, imageFileName) {
  let str = '';
  json.imageUrls.forEach((currentValue) => {
    str = `${str}${json.uniqueName},${currentValue}\n`;
  });
  fs.appendFile(imageFileName, str);
}
let timer = 0;
function getSingleProductCallBack(tempUrl, productFolderName, imageFolderName) {
  setTimeout(() =>
    request(tempUrl, (error, response, html) => {
      const json = { };
      if (!error) {
        const $ = cheerio.load(html);
        json.productUrl = tempUrl;
        json.uniqueName = trimUrltoProduct(tempUrl);
        json.productName = $('.product-name > h1').html();
        json.productName === null ? console.log('Product Name null', tempUrl) : null;
        json.description = trimExtraNextLine($('div.product-shop > div.description > div.std').html());
        json.price = trimEuroSign($('.product-shop > .price-box > .regular-price > span.price').text());
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
        writeProductCsv(json, productFolderName);
        writeProductImgCsv(json, imageFolderName);
      } else {
        console.log('error', error);
        requestErrCounter += 1;
      }
    })
  , timer);
  timer += 5000;
}

function recursivegetChildUrl(url, productFolderName, imageFolderName) {
  request(url, (error, response, html) => {
    // first get all the url
    console.log('now scrape', url);
    if (!error) {
      const $ = cheerio.load(html);

      _.map($('.products-grid > li > a'), (el) => {
        const href = $(el).attr('href');
        getSingleProductCallBack(href, productFolderName, imageFolderName);
      });
      const nextUrl = $('.i-next').attr('href');
      if (nextUrl !== undefined) {
        recursivegetChildUrl(nextUrl, productFolderName, imageFolderName);
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


function getAllTheUrl(url) {
  request(url, (error, response, html) => {
    console.log('get the urls for the whole web');
    if (!error) {
      const $ = cheerio.load(html);
      fs.mkdir(`assets/${prefix}`, err => (
        err ?
          console.error(err)
          :
          console.log(`assets/${prefix} created successfully!`))
      );

      _.map($('.level2.no-level-thumbnail > a'), (el) => {
        const href = $(el).attr('href');
        const nameAry = _.split(href, '/');
        const firstLevel = nameAry[nameAry.length - 3];
        if (firstLevel === scrapingLevel) {
          const folder = nameAry[nameAry.length - 2];
          const product = nameAry[nameAry.length - 1];
          const returnObj = {
            folder,
            name: product,
            url: href,
            fileDirectory: `assets/${prefix}/${folder}/${product}.csv`,
            imageDirectory: `assets/${prefix}/${folder}/${product}Image.csv`,
          };
          fs.mkdir(`assets/${prefix}/${folder}`, (err) => {
            return err ?
              console.error(err)
              :
              console.log(`assets/${prefix}/${folder} created successfully!`);
          });
          pathAry.push(returnObj);
        }
      });

      _.map(pathAry, (el) => {
        recursivegetChildUrl(el.url, el.fileDirectory, el.imageDirectory);
      });
    }
  });
}
getAllTheUrl(mainUrl);

//getSingleProductCallBack('http://cs-es-p.bcnetcom.com/custom/cycling/skinsuits/short-sleeve-skinsuit.html', 'assets/Spain/cycling/skinsuits.csv', 'assets/Spain/cycling/skinsuitsImage.csv');

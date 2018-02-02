const fs = require('fs');
const _ = require('lodash');

const callback = (err, data) => {
  if (err) {
    return console.error(err);
  };
  const content = data.toString();
  const json = _.chain(content)
    .split('\r\n')
    .map(value => _.split(value, ','))
    .reduce((result, value) => _.concat(result, { patone: value[0], rgb: value[1] }), [])
    .value();
  fs.appendFile('patone.json', JSON.stringify(json));
};
fs.readFile('pantone.csv', callback);

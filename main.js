'use strict';

var fs = require('fs');
var questor = require('questor');
var lodash = require('lodash');
var dot = require('dot');

cleanBuildDir();

var event = JSON.parse(fs.readFileSync('./config.json'));

var preview = true;
var token = "";
var url = "";


if(preview){
  token = event.contentful.previewToken;
  url   = 'preview.contentful.com';
} else {
  token = event.contentful.accessToken;
  url   = 'cdn.contentful.com';
}

var options = {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

var url = [
  'https://',
  url,
  '/spaces/',
  event.contentful.space,
  '/sync?initial=true'
].join('');

var request = questor(url, options);
request.then(function(rawResponse) {

  var payload = JSON.parse(rawResponse.body);
  var dots =  dot.process({path: './templates'})
  //console.log(payload);
  lodash.map(payload.items, function(item) {
    console.log("----");

    for(var language in item.fields.title) {
      var page = JSON.parse(setLanguage(language, item))
      var contentType = page.entity.sys.contentType;
      var filename = getFileName(page.entity.fields.title[language]);

      if (contentType) {
        writeToFile(filename, dots[contentType.sys.id](page))
      } else {
        writeToFile(filename, dots[page.entity.sys.type.toLowerCase()](page))
      }
    }
  });
});

function setLanguage(language, item){
  var newItem =  JSON.stringify({
    entity: item,
    language: language
  });

  return newItem;
}

function writeToFile(file, content){
  fs.writeFile(file, content, function(err, data){
    if (err) console.log(err);
  });
}

function getFileName(title){
  var filename = './build/' + title.replace(/[/\\?%*:|"<> ]/g, '-') + '.html';
  console.log(filename);
  return filename;
}

function cleanBuildDir(){
  var dir = './build';
  if (fs.existsSync(dir)){
    deleteFolderRecursive(dir);
  }
  fs.mkdirSync(dir);
}

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index){
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

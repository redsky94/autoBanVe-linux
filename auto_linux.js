const puppeteer = require('puppeteer');
const isNumber = require('is-number');
var xlsx = require('node-xlsx');
const vnmToAlphabet = require('vnm-to-alphabet');
const fs = require('fs');
const path = require('path');
const { cp } = require('fs');
const { PassThrough } = require('stream');
let downloadPath = "";


(async () => {
  var today = new Date(); 
  var yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  var dd = String(today.getDate()).padStart(2, '0');
  var dd_yes = String(yesterday.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); 
  var mm_yes = String(yesterday.getMonth() + 1).padStart(2, '0');  
  var yyyy = today.getFullYear();
  var yyyy_yes = yesterday.getFullYear();

  today = yyyy + mm  + dd;
  const today_work = dd +'-'+mm+'-'+yyyy;
  yesterday = yyyy_yes+mm_yes+dd_yes;
  const yesterday_work = dd_yes+'-'+mm_yes+'-'+yyyy_yes;
  console.log(today);
  console.log(yesterday);
  console.log(today_work);
  console.log(yesterday_work);
  const browser = await puppeteer.launch({headless:true});
  //const browser = await puppeteer.launch({headless:true, args:['--no-sandbox']});
  const page = await browser.newPage();
  await page.goto('https://dulieu.tramthoitiet.vn/so-lieu-tram');
  // Login
  await page.type('#ad_soyad', 'thuydienbanve');
  await page.type('#password', 'thuydienbanve2019');
  await page.waitForTimeout(2000);
  await Promise.all([
   // page.click('#loginSubmit'),
    //page.waitForSelector("#login > form > div.row.mt-5.mb-4 > div.col-sm-6.text-right > button"),
    page.click('#login > form > div.row.mt-5.mb-4 > div.col-sm-6.text-right > button'),
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);
  await page.goto("https://dulieu.tramthoitiet.vn/so-lieu-tram");
 // console.log(today_work);
  //console.log(yesterday_work);
  await Promise.all([
    console.log("Xem nao!!"),
    console.log(yesterday_work),
    page.waitForSelector("#data-load>div>h4"), 
    page.$eval('#fdate', el => {
      var today = new Date(); 
      var yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1); 
      var dd_yes = String(yesterday.getDate()).padStart(2, '0'); 
      var mm_yes = String(yesterday.getMonth() + 1).padStart(2, '0');   
      var yyyy_yes = yesterday.getFullYear();  
      yesterday = yyyy_yes+mm_yes+dd_yes;
      const yesterday_work = dd_yes+'-'+mm_yes+'-'+yyyy_yes;  
      console.log(yesterday_work);
      el.value = yesterday_work;
    }),
    page.$eval('#tdate', el => {
      var today = new Date();     
      var dd = String(today.getDate()).padStart(2, '0');  
      var mm = String(today.getMonth() + 1).padStart(2, '0');   
      var yyyy = today.getFullYear(); 
      const today_work = dd +'-'+mm+'-'+yyyy;  
      console.log(today_work); 
      el.value = today_work;
    }),
    page.waitForSelector("#submit"),
    page.click("#submit"),
  ]);
 
  await page.waitForSelector("#submit");
  
  //await page._client.send('Page.setDownloadBehavior', {
    //behavior: 'allow',
    //downloadPath: downloadPath
  //});
 

  //await page.select("#station","012049CD");
  var dropdowns = await page.$$eval("select#station option", all => all.map(a => a.value))
  //if(dropdowns.indexOf("01205A28_Sốp Lao (18)") != -1){
  {
    await console.log("Show list of stations:");
    await console.log(dropdowns.length);
  }
  let options = 'lowercase';
  var dropdowns_text = await page.$$eval("select#station option", all => all.map(a => a.textContent.split('_')[1].split(' (')[0]))
  { 
    await console.log(dropdowns_text);
  }
  // xu ly ten folder 
  for (let m =0; m< dropdowns.length;m++) {
    var tempString = vnmToAlphabet(dropdowns_text[m], options);
     
    dropdowns_text[m] =  tempString.replace(/\s/g, '_');
  }
  await console.log(dropdowns_text);
  const base_core_dir = "~\\crawl\\KQ\\";
  //const basedir_name = "D:\\KQ\\num";
  var temp_dir_work  = new Array();
  console.log("bat dau in ra thu muc:");
  for (let j = 0; j< dropdowns_text.length;j++) {
	//console.log("in ra khi chua qua path.resolve");
	await createDirectories("KQ",dropdowns_text[j]); 
    var dir =dropdowns_text[j];
	 
	console.log(dir);
    temp_dir_work[j] =path.resolve("KQ/"+dir);
     
  }
  
  // tao xong mang 21 folder 
  //await console.log(dropdowns);
   await console.log("-------------------temp_dir_work----------------------");
   await console.log(temp_dir_work);
  //await console.log("Tat chuong trinh!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  var arrSend2CSV = new Array();
  let sizeArr = dropdowns.length;
  //sizeArr =1; //For debug
  for (let i = 0; i<sizeArr; i++) {
      await page.waitForSelector("#station");
      await page.waitForSelector("#submit");
      await console.log(dropdowns[i].toString());
      await page.select("#station",dropdowns[i].toString());
      await page.waitForTimeout(5000);
      
      await page.waitForSelector("#submit"); 
      await page.click("#submit");
      await page.waitForTimeout(5000);
      await page.waitForSelector("#data-load > div > h4");
      let element = await page.$('#data-load > div > h4');
      let value = await page.evaluate(el => el.textContent, element);
      await console.log(value);     
      await autoScrollDown(page);
      await page.waitForSelector("#btn-download-excel>button");
     
      // thay doi folder , cach hoi cui'
      let temp_dir = path.resolve("KQ/"+dropdowns_text[i]);
      downloadPath =temp_dir;
      let report_dir = path.resolve("KQ/REPORT");
      report_dir = report_dir;
      await console.log(Math.round((i+1)/sizeArr*100)+" % ------>"+downloadPath);
      await page._client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
      });
      await page.evaluate(_ => {
        //document.querySelector("#submit").click();
        document.querySelector("#btn-download-excel>button").click();
        //document.body.style.background = '#000';
      });  
    await page.waitForTimeout(5000);
    // convert to csv 
    
    //await Promise.all([
      
    //]); 
    var temp_path = path.resolve("KQ/REPORT/_temp");
    var path4reportToday = report_dir+ "/"+today;
    arrSend2CSV[i] = path.resolve(temp_path+"/"+dropdowns[i]+"_"+today+".xls");
	console.log(" -----------------arrSend2CSV[i]----------------------");
	console.log(arrSend2CSV[i]);
    await fs.rename(downloadPath+"/"+"so_lieu_tram.xls",arrSend2CSV[i], function(err) {
      if ( err ) console.log('ERROR: ' + err);
    });
    //await convert2Csv();
    await autoScrollUp(page);
    if (i == sizeArr -1) {
      console.log("Thuc hien xong het roi!!");
      console.log("Chuan bi converting to CSV ...");
      await convert2Csv(arrSend2CSV,path4reportToday,dropdowns);
      //await testCSV(arrSend2CSV);
    }
  }
  await console.log("Doi 5s");
  await page.waitForTimeout(5000);
  await console.log("Doi xong 5s ");
  
  await page.screenshot({ path: 'example.png' });

 
  await console.log(" Xong roi!!");
  await browser.close();
})();


 
async function autoScrollDown(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0; 
            //console.log(totalHeight);
            var distance = 90;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                window.scrollBy
                totalHeight += distance;
               // console.log(totalHeight);
                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}
async function autoScrollUp(page){
  await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
          var totalHeight = document.body.scrollHeight;
          // console.log("totalHeight");
           //console.log(totalHeight);
          var distance = -100;
          var timer = setInterval(() => {
              var scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;
              //console.log(totalHeight);
              if(totalHeight <= 0){
                  clearInterval(timer);
                  resolve();
              }
          }, 100);
      });
  });
}
async function convert2Csv (recivedArray, path4reportToday, codeStation) {
  let report_dir_by_day = path4reportToday;
  if (!fs.existsSync(report_dir_by_day)){
    fs.mkdirSync(report_dir_by_day);
  }
  console.log(recivedArray[0]);
  for (let iArr = 0; iArr < recivedArray.length;iArr ++){
	var rows = [];
	var writeStr = "Time, rainfall\n";
    var inputFilename = recivedArray[iArr];
    var obj = await xlsx.parse(inputFilename); // parses a file
    for(var iii = 0; iii < obj.length; iii++)  //looping through all sheets
    {
        var sheet = obj[iii];
        //loop through all rows in the sheet
        for(var jj = 0; jj < sheet['data'].length; jj++)
        {
                //add the row to the rows array
                rows.push(sheet['data'][jj]);
        }
    }
   // console.log(rows);
    //creates the csv string to write it to a file
    for(var ii = 0; ii < rows.length; ii++)
    {
        var temp = rows[ii][0];
        if (temp === undefined) {
            //console.log("them vao");
            temp = '';
        }
        temp = temp.toString().split(' ')[0].split(':')[0];
        var arr = new Array();
        if (isNumber(temp)) {
            var buff;
            buff = await rows[ii][0].toString().split(' ')[1] +" "+rows[ii][0].split(' ')[0];
            arr[0] = buff+","+rows[ii][1];
            
            //buff= arr[0]+arr[1];
            writeStr += arr.join(",") + "\n";
        }
            
    }
    // for report 
    //
    
    // create folder to save report by day
    
    var outputFilename = report_dir_by_day+"/"+ codeStation[iArr]+".csv";
    await fs.writeFile(outputFilename, writeStr, function(err) {
      if(err) {
          return console.log(err);
      }
      console.log("file "+ codeStation[iArr].toString() +".csv was saved in the destination directory!");
    });
  }
      
}
async function testCSV (recivedArray) {
  for(let i = 0; i< recivedArray.length;i++) {
    await console.log(recivedArray[i]);
  }
}
async function createDirectories(thumuccap1,thumuccap2) {
	var __dirname ="";
	if (thumuccap1 == '_') 
		__dirname= path.resolve();
	else
		__dirname = path.resolve(thumuccap1);
   thumuccap2 = thumuccap2.replace(/^\.*\/|\/?[^\/]+\.[a-z]+|\/$/g, ''); // Remove leading directory markers, and remove ending /file-name.extension
   fs.mkdir(path.resolve(__dirname, thumuccap2), { recursive: true }, e => {
       if (e) {
           console.error(e);
       } else {
           console.log('Success');
       }
    });
}
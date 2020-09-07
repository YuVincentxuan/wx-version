#!/usr/bin/env node

const exec = require('child_process').exec;
const fs = require('fs');

const packageJSON = require('./package.json');
/** package.json文件的version参数 */
const version = packageJSON.version
/** 命令行的所有参数 */
let options = process.argv;
/** 命令行的type参数 */
let type = null;
/** 命令行的operation参数 */
let operation = null;
/** 用户输入的version参数 */
let inputVersion = null;
/** 新的version参数 */
let newVersion = null;

const regex = /^\d+(?:\.\d+){2}$/ //正则判断版本号
const typeArr = ['alpha', 'beta', 'gamma'] // 支持的版本
const operationArr = ['major', 'minor', 'patch'] // 支持的操作
const optionsArr = [] // 错误指令的操作
options = options.slice(2, options.length);

for (let i = 0; i < options.length; i++) {
  const temp = (options[i]).replace(new RegExp('\-{2,}', 'ig'), '').toLowerCase()
  if (temp.indexOf('type') > -1 || typeArr.some((item) => {
      return item === temp
    })) { //存在type参数
    type = temp.split("=")[1] || temp;
  } else if (temp.indexOf('operation') > -1 || operationArr.some((item) => {
      return item === temp
    })) {
    operation = temp.split("=")[1] || temp;
  } else if (temp.indexOf('version') > -1 || regex.test(temp)) { //存在version参数
    inputVersion = temp.split("=")[1] || temp;
  } else {
    //code
    optionsArr.push(options[i])
  }
}
if (optionsArr.length !== 0) {
  const warning = optionsArr.join(" ");
  console.log("mi-version: %s 指令错误 ", warning);

} else {
  if (inputVersion) { //存在设置version参数则改变原来的version
    newVersion = inputVersion;
  } else if (operation) {
    newVersion = handleOperation(version, operation)
  } else if (type) { //不设置version则根据type来进行修改version
    newVersion = handleType(version, type);
  } else if (options.length === 0) {
    newVersion = handleOperation(version, 'patch')
  } else {
    newVersion = null;
    console.log("mi-version: 没有改变version ");
  }
  //修改了version则写入
  if (version !== newVersion && newVersion) {
    packageJSON.version = newVersion || version;
    //同步写入package.json文件
    fs.writeFileSync('package.json', JSON.stringify(packageJSON, null, 2));
    console.log("mi-version: 更新package的version为：%s ", packageJSON.version);
    // pullRemote();
  } else {
    console.log("mi-version: 两次版本号需要不同")
  }
}

/**
 * 根据分支类型处理版本号version
 * @param {string} oldVersion 旧的版本号
 * @param {string} type 版本类型
 * @private
 */
function handleType(oldVersion, type) {
  oldVersion = oldVersion.split('-')
  var versionNumber = oldVersion[0]
  var versionType = oldVersion[1] || ''
  if (versionType === type) {
    return handleOperation(oldVersion.join('-'), 'patch')
  } else {
    return oldVersion[0] + '-' + type
  }
}
/**
 * 根据分支类型处理版本号version
 * @param {string} oldVersion 旧的版本号
 * @param {string} operation 操作类型
 * @private
 */
function handleOperation(oldVersion, operation) {
  oldVersion = oldVersion.split('-')
  const versionNumber = oldVersion[0]
  const versionType = oldVersion[1] || ''
  const oldVersionArr = versionNumber.split(".");
  //版本号第一位 如：1.2.3 则为 1
  let firstNum = +oldVersionArr[0];
  //版本号第二位 如：1.2.3 则为 2
  let secondNum = +oldVersionArr[1];
  //版本号第三位 如：1.2.3 则为 3
  let thirdNum = +oldVersionArr[2];
  switch (operation) {
    case "major":
      //hotfix分支的处理逻辑
      ++firstNum;
      break;

    case "minor":
      //release分支的处理逻辑
      ++secondNum;
      break;

    case "patch":
      //hotfix分支的处理逻辑
      ++thirdNum;
      break;

    default:
      break;
  }

  return (versionType && firstNum + "." + secondNum + "." + thirdNum + '-' + versionType) || firstNum + "." + secondNum + "." + thirdNum;
}
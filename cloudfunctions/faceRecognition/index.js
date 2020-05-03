// 云函数入口文件
const cloud = require('wx-server-sdk')
const got = require('got'); 
const extCi = require("@cloudbase/extension-ci");
const tcb = require("tcb-admin-node");
const tencentcloud = require("tencentcloud-sdk-nodejs")
// 导入对应产品模块的client models。
const CvmClient = tencentcloud.iai.v20180301.Client
const models = tencentcloud.iai.v20180301.Models

const Credential = tencentcloud.common.Credential;//验证对象类
const ClientProfile = tencentcloud.common.ClientProfile;//client选项
const HttpProfile = tencentcloud.common.HttpProfile;//http选项
// 实例化一个认证对象，入参需要传入腾讯云账户secretId，secretKey
let cred = new Credential("AKIDoQmiOugfAzZtxkOyhDSGn27VeWAYjPvB", "fwxjHcfRzmFRM3XkX4rUv4ye4D6Byart");

// 实例化一个http选项，可选的，没有特殊需求可以跳过。
let httpProfile = new HttpProfile();
httpProfile.reqMethod = "POST";
httpProfile.reqTimeout = 30;
httpProfile.endpoint = "iai.tencentcloudapi.com";

// 实例化一个client选项，可选的，没有特殊需求可以跳过。
let clientProfile = new ClientProfile();
clientProfile.signMethod = "HmacSHA256";
clientProfile.httpProfile = httpProfile;

// 实例化要请求产品(以cvm为例)的client对象。clientProfile可选。
let client = new CvmClient(cred, "", clientProfile);

//let fileContent = imageBuffer; // Uint8Array|Buffer格式图像内容
tcb.init({
  env: "azhuo-id"
});
tcb.registerExtension(extCi);
cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {

    //获取fileID
    let fileID = event.fileID
    let imgUrl = getImageUrl(fileID)
    await imgUrl.then(res => {
        imgUrl = res
    })
    //return imgUrl
    return detectFace(imgUrl)
}

// 获取图片临时链接
const getImageUrl = async (fileID) => {
    const { fileList } = await tcb.getTempFileURL({
      fileList: [fileID]
    })
    console.log(fileList)
    return fileList[0].tempFileURL
}

// 人脸识别示例代码
const detectFace = (Url) => {

    let faceReq = new models.DetectFaceRequest()
    
    // 支持图片链接或图片base64数据
    let query_string = JSON.stringify({
        Url,
        MaxFaceNum: 5,
        NeedFaceAttributes: 1
    })
    
    // 传入json参数
    faceReq.from_json_string(query_string);

    // 进行人脸识别
    return new Promise((resolve, reject) => {
        // 通过client对象调用想要访问的接口，需要传入请求对象以及响应回调函数
        client.DetectFace(faceReq, function (error, response) {
        // 请求异常返回，打印异常信息
        if (error) {
          const { code = '' } = error
          console.log('code :', code);
  
          resolve({
            data: {},
            time: new Date(),
            status: -10086,
            message: 'DetectFace ' + '图片解析失败'
          })
          return
        }
        // 请求正常返回，打印response对象
        resolve({
          data: response,
          time: new Date(),
          status: 0,
          message: ''
        })
      })
    });
}

//SDK
const sdk = (imgUrl) => {
    

    // 实例化一个认证对象，入参需要传入腾讯云账户secretId，secretKey
/*     let cred = new Credential("AKIDoQmiOugfAzZtxkOyhDSGn27VeWAYjPvB", "fwxjHcfRzmFRM3XkX4rUv4ye4D6Byart");

    // 实例化一个http选项，可选的，没有特殊需求可以跳过。
    let httpProfile = new HttpProfile();
    httpProfile.reqMethod = "POST";
    httpProfile.reqTimeout = 30;
    httpProfile.endpoint = "iai.tencentcloudapi.com";

    // 实例化一个client选项，可选的，没有特殊需求可以跳过。
    let clientProfile = new ClientProfile();
    clientProfile.signMethod = "HmacSHA256";
    clientProfile.httpProfile = httpProfile;

    // 实例化要请求产品(以cvm为例)的client对象。clientProfile可选。
    let client = new CvmClient(cred, "", clientProfile); */

    let req = new models.DetectFaceRequest()
    req.Url = imgUrl

    client.DetectFace(req, function(err, response){
        // 请求异常返回，打印异常信息
        if (err) {
            console.log(err);
            return err;
        }
        // 请求正常返回，打印response对象
        console.log(response.to_json_string());
        return "holle"
        return response.to_json_string()
    })
}
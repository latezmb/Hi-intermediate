//图片人脸识别返回的信息
let ImgInfo = []
//图片fileID
let fileID = ""
//showImgInfo的点击判断
let num = -1
//云储存图片路劲
let cloudPath = ""
const ctx = wx.createCanvasContext("myCanvas")
Page({
    data: {
        imgPath: "/images/image_photo_767px_1138951_easyicon.net.png",
        imgList:[],
        toast: "上传带人脸的正面照",
        page: "page",
        select: [0,-1,-1]
    },
    onLoad: function(options) {
        ctx.drawImage(this.data.imgPath, 75, 75, 150, 150)
        ctx.draw()
        //this.Info(1)
    },

    //选择图片
    selectImg: function () {
        wx.chooseImage({
            count: 1,
            success: (res) => {
                this.setData({
                    imgPath: res.tempFilePaths[0],
                    imgList:[],
                    toast: "上传带人脸的正面照",
                    page: "page",
                    select: [0,-1,-1]
                })
                ctx.drawImage(this.data.imgPath, 0, 0, 300, 300)
                ctx.draw()
                wx.setNavigationBarColor({
                    backgroundColor: '#969BA2',
                    frontColor: "#ffffff"
                })
                ImgInfo = []
                fileID = ""
                num = -1
            }
        })
    },

    //上传图片
    uploadImg: function() {
        var filePath = this.data.imgPath
        cloudPath = "intermediate/" + `${Date.now()}-${Math.floor(Math.random(0, 1) * 1000)}` + filePath.match(/\.[^.]+?$/)[0]
        wx.showLoading({
            title: '上传图片中',
        })
        wx.cloud.uploadFile({
            filePath: filePath,
            cloudPath: cloudPath,
        })
        .then((res) => {
            //console.log(res)
            wx.hideLoading({
              complete: (res) => {},
            })
            wx.showLoading({
              title: '图片审查中',
            })
            fileID = res.fileID
            //调用图片安全审查函数
            wx.cloud.callFunction({
                name: "trialImage",
                data: {
                  imgPath: cloudPath
                }
            })
            .then(res => {
                //console.log(res)
                const { result: { PoliticsInfo = {}, PornInfo = {}, TerroristInfo = {} } } = res
                if (PoliticsInfo.Code === 0 && PornInfo.Code === 0 && TerroristInfo.Code === 0) {
                    wx.hideLoading({
                        complete: (res) => {},
                    })
                    wx.showLoading({
                        title: '获取人脸信息',
                    })
                    //调用人脸识别云函数
                    wx.cloud.callFunction({
                        name: "faceRecognition",
                        data: {
                            fileID: fileID
                        }
                    })
                    .then((res) => {
                        //console.log(res)
                        const {result: {data: {FaceInfos = {}}}} = res
                        //console.log(FaceInfos)
                        ImgInfo = res.result.data
                        for (var i in FaceInfos) {
                            ctx.setStrokeStyle('#54B59F')
                            ctx.rect(FaceInfos[i].X/res.result.data.ImageWidth * 300, FaceInfos[i].Y/res.result.data.ImageHeight * 300, FaceInfos[i].Width/res.result.data.ImageWidth * 300, FaceInfos[i].Height/res.result.data.ImageHeight * 300)
                            ctx.stroke()
                            ctx.draw(true)
                        }
                        //console.log(ImgInfo)
                         //智能截图
                        wx.hideLoading({
                            complete: (res) => {},
                        })
                        wx.showLoading({
                            title: '处理图片',
                        })
                        wx.cloud.callFunction({
                            name: "CJimage",
                            data: {
                                fileID: fileID
                            }
                        })
                        .then(res => {
                            wx.hideLoading({
                                complete: (res) => {},
                            })
                            wx.showToast({
                                title: '处理完成',
                            })
                            //console.log(res)
                            var temp = []
                            temp.push(res.result)
                            for (var i in ImgInfo.FaceInfos) {
                                temp.push(res.result+ "?imageMogr2/cut/" + ImgInfo.FaceInfos[i].Width + "x" + ImgInfo.FaceInfos[i].Height + "x" + ImgInfo.FaceInfos[i].X + "x" + ImgInfo.FaceInfos[i].Y)
                            }
                            //console.log(temp)
                            this.setData({
                                hidden: true,
                                imgList: temp,
                                toast: "点击人脸框，可以显示人脸魅力值",
                                page: "page-o"
                            })
                            wx.setNavigationBarColor({
                                backgroundColor: '#8D5D19',
                                frontColor: "#ffffff"
                            })
                        })
                        .catch(res => {
                            wx.hideLoading({
                                complete: (res) => {},
                            })
                            wx.showToast({
                              title: '处理图片失败',
                              icon: "none"
                            })
                        })
                    })
                    .catch(res => {
                        wx.hideLoading({
                            complete: (res) => {},
                        })
                        wx.showToast({
                          title: '识别失败',
                          icon: "none"
                        })
                    })
                }else {
                    wx.showToast({
                    title: '上传图片不规范',
                    icon: 'none'
                    })
                }
            })
            .catch(res => {
                wx.hideLoading({
                    complete: (res) => {},
                })
                wx.showToast({
                    title: '审查失败',
                    icon: "none"
                })
            })
        })
        .catch(res => {
            wx.hideLoading({
              complete: (res) => {},
            })
            wx.showToast({
              title: '上传失败',
              icon: "none"
            })
            console.log(res)
        })
    },
    test: function(event) {
        var id = event.currentTarget.dataset.id
        var tempSelect = []
        for (var i in this.data.select) {
            i == id ? tempSelect.push(i) : tempSelect.push(-1)
        }
        this.setData({
            select: tempSelect
        })
        if (num != id) {
            this.clearCanvas()
            this.paintingImg()
            this.showImgInfo(id)
            num = id
            this.setData({
                toast: "点击红色人脸框，可隐藏人脸魅力值"
            })
        }else {
            //先清空，再画回来
            this.clearCanvas()
            this.paintingImg()
            this.showImgInfo(0)
            num = -1
            this.setData({
                toast: "点击人脸框，可以显示人脸魅力值"
            })
        }
    },
    //显示信息
    showImgInfo: function(id) {
        //console.log(ImgInfo)
        for (var i in ImgInfo.FaceInfos) {
            if (id-1 == i) {
                ctx.setStrokeStyle('#DF489E')
                ctx.rect(ImgInfo.FaceInfos[i].X/ImgInfo.ImageWidth * 300, ImgInfo.FaceInfos[i].Y/ImgInfo.ImageHeight * 300, ImgInfo.FaceInfos[i].Width/ImgInfo.ImageWidth * 300, ImgInfo.FaceInfos[i].Height/ImgInfo.ImageHeight * 300)
                ctx.stroke()
                ctx.draw(true)
                
                this.Info(ImgInfo.FaceInfos[i])
            }else {
                ctx.setStrokeStyle('#54B59F')
                ctx.rect(ImgInfo.FaceInfos[i].X/ImgInfo.ImageWidth * 300, ImgInfo.FaceInfos[i].Y/ImgInfo.ImageHeight * 300, ImgInfo.FaceInfos[i].Width/ImgInfo.ImageWidth * 300, ImgInfo.FaceInfos[i].Height/ImgInfo.ImageHeight * 300)
                ctx.stroke()
                ctx.draw(true)
            }
        }
    },

    Info: function(ImgObj) {
        //console.log(ImgObj)
        let X = 0
        if(ImgObj.X/ImgInfo.ImageWidth * 300 > 110){
            X = ImgObj.X/ImgInfo.ImageWidth * 300 - 110
        }else {
            X = ImgObj.X/ImgInfo.ImageWidth * 300 + ImgObj.Width/ImgInfo.ImageWidth * 300 + 10
        }
        let Y = ImgObj.Y/ImgInfo.ImageWidth * 300
        ctx.setFillStyle('#61E6BD')
        ctx.fillRect(X, Y, 100, 120)
        ctx.draw(true)
        let {FaceAttributesInfo:{ Age ={}, Expression = {}, Beauty = {}, Glass = {}, Hat = {}, Mask = {}}} = ImgObj
        //处理表情
        if (Expression < 33) {
            Expression = "正常"
        }else if (Expression < 66) {
            Expression = "微笑"
        }else{
            Expression = "大笑"
        }
        //处理眼镜
        Glass ? Glass = "有" : Glass = "无"
        //处理帽子
        Hat ? Hat = "有" : Hat = "无"
        //处理口罩
        Mask ? Mask = "有" : Mask = "无"

        //设置信息
        ctx.setFillStyle('black')
        ctx.setFontSize(13)
        ctx.fillText('年龄：' +Age, X+10, Y+20)
        ctx.fillText('表情：' + Expression, X+10, Y+38)
        ctx.fillText('魅力：' + Beauty, X+10, Y+56)
        ctx.fillText('眼镜：' + Glass, X+10, Y+74)
        ctx.fillText('帽子：' + Hat, X+10, Y+92)
        ctx.fillText('口罩：' + Mask, X+10, Y+110)
        ctx.draw(true)
    },

    //清空画布
    clearCanvas: function () {
        ctx.clearRect()
        ctx.draw()
    },

    //重画上图片
    paintingImg: function() {
        ctx.drawImage(this.data.imgPath, 0, 0, 300, 300)
        ctx.draw()
    }
    
})
//index.js
//获取应用实例
var app = getApp()
Page({
  data: 
  {
    userInfo: {},
    addressData:null,
    userStatus:{},
    addRessName:false,
    content:false,
    imgStr:null,
    httpImg:[],
    imgLenght:0
  },
  onLoad: function (e) 
  {
      var that = this
      //调用应用实例的方法获取全局数据
      app.getUserInfo(function(userInfo){
        //更新数据
        that.setData({
          userInfo:userInfo
        })
      })

    that.data.userStatus['name'] = e.name;
    that.data.userStatus['address'] = e.address;
    that.data.userStatus['lat'] = e.lat;
    that.data.userStatus['lnt'] = e.lnt;
    that.data.userStatus['userId'] = e.userId;

     // console.log(event);
  },

  // 表单提交
  formSubmit:function(e)
  {
    var that = this
    
    // 如果文本为空提示用户输入 否则提交表单
    if(e.detail.value.content == '' && that.data.imgStr == null)
    {
       wx.showModal({
            content: '请填写内容后点击提交保存！',
            showCancel:false,
            success: function(res) 
            {
              if (res.confirm) 
              {
                //console.log('用户点击确定');
              }
            }
          });
    }
    else
    {
      if(that.data.addressData == null)
      {
        that.data.addressData = that.data.userStatus
      }

      // console.log(that.data.httpImg.join(','))
      // return

      // 执行REQUEST写入数据库
      wx.request({
        url: app.requestUrl,
        data: 
        {
          flag: 'add' ,
          nickName:that.data.userInfo.nickName,
          avatarUrl:that.data.userInfo.avatarUrl,
          name:that.data.addressData.name,
          address:that.data.addressData.address,
          latitude:that.data.addressData.latitude,
          longitude:that.data.addressData.longitude,
          content:e.detail.value.content,
          userId:that.data.userStatus.userId,
          //imgStr:that.data.httpImg.join(',')
          imgStr:that.data.imgStr
        },
        header: 
        {
            'content-type': 'application/x-www-form-urlencoded',
        },
        method:'POST',
        success: function(lb) 
        {
          // console.log(lb.data)
          // return;
          wx.redirectTo({
            url: '../../pages/main/main?userId=' + app.userId +'&state=0'
          });
        },
        fail: function(lb)
        {
          console.log(lb)
        }
      })
    }
  },
  // 清除
  formReset: function() 
  {
    console.log('form发生了reset事件')
  },

  // 选择地理位置
  bindAddress: function()
  {
    var that = this

    // 取消选择地理位置后获取当前人经纬度调用后台接口接收当前地理位置
    wx.chooseLocation({
      success:function(lb)
      {
        //console.log(lb)
        that.data.addressData = lb
        that.setData({
            addRessName:lb.name
          })
        //console.debug(that.data.addressData)  
      },
      cancel: function(lb) // 取消选择
      {
        //that.data.addressData = that.data.userStatus
      },
      fail: function(lb)
      {
        console.log(lb)
      }
    })
  },

  // 相册
   chooseImage: function () 
   {
    var that = this
    // 重置上传数组
    that.setData({
      httpImg:[]
    })
    // 上传图片
    wx.chooseImage({
      sourceType: ['album', 'camera'],
      sizeType: ['original', 'compressed'],
      count: 1,
      success: function (res) 
      {
         var tempFilePaths = res.tempFilePaths
         that.data.imgLength = tempFilePaths.length

         // 遍历缓存图片上传服务器
         for(var a=0; a<tempFilePaths.length; a++)
         {
            wx.uploadFile({
                url: app.requestUrl, 
                filePath: tempFilePaths[a],
                name: 'file',
                formData:{
                  flag:'uploadfile'
                },
                success: function(res)
                {
                  //console.log(res)
                  var data = res.data
                  that.data.httpImg.push(res.data)
                },
                fail: function(res)
                {
                  console.debug(res)
                }
            })
         }

         var timeS = 0;
         var timeOut = setInterval(function(){
           console.info(that.data.imgLength +"--"+that.data.httpImg.length)
           if(that.data.imgLength == that.data.httpImg.length)
           {
              that.setData({
                  imageList:that.data.httpImg,
                  imgStr:that.data.httpImg.join(",")
              })

              console.log(that.data.imageList.join(",")) 
              clearInterval(timeOut)
           }
           else
           {
             if(timeS > 50)
             {
                console.log('图片上传失败,请重试')  
                clearInterval(timeOut)
             }
             else
             {
               that.bindLoding();
               console.log('上传中')
             }
           }

           timeS++;
           
         },1000)
      }
    })
  },
  previewImage: function (e) // 显示图片大图
  {
    var current = e.target.dataset.src

    wx.previewImage({
      current: current,
      urls: this.data.imageList
    })
  },
  bindLoding:function(){ // LOADING加载
    wx.showToast({
      title: '图片上传中',
      icon: 'loading'
    })
  }

// 结束
})







 
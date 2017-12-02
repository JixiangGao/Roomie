Page({
  data:{
    phoneNum:'12345678901'//测试用的号码，并非真实号码
  },
  // 长按号码响应函数
  phoneNumTap:function(){
    var that=this;
    // 提示呼叫号码还是将号码添加到手机通讯录
    wx.showActionSheet({
      itemList: ['呼叫','添加联系人'],
      success:function(res){        
        if(res.tapIndex==0){
          // 呼叫号码
          wx.makePhoneCall({
            phoneNumber: that.data.phoneNum,
          })
        }else if(res.tapIndex==1){
          // 添加到手机通讯录
          wx.addPhoneContact({
            firstName: 'test',//联系人姓名
            mobilePhoneNumber: that.data.phoneNum,//联系人手机号
          })
        }
      }
    })
  }
})
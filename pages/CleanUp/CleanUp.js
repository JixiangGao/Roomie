// pages/CleanUp/CleanUp.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    listData: [
      { "week": "一", "name": "小王", "time": "9:00pm" },
      { "week": "二", "name": "  ", "time": "" },
      { "week": "三", "name": "小张", "time": "9:00pm" },
      { "week": "四", "name": "  ", "time": "" },
      { "week": "五", "name": "大王", "time": "9:00pm" },
      { "week": "六", "name": "  ", "time": "" },
      { "week": "日", "name": "小李", "time": "9:00pm" }
    ],
    key: '',
    data: '',
    dialog: {
      title: '',
      content: '',
      hidden: true
    }
  },
  keyChange: function (e) {
    this.data.key = e.detail.value
  },
  dataChange: function (e) {
    this.data.data = e.detail.value
  },
  getStorage: function () {
    var key = this.data.key,
      data = this.data.data
    var storageData

    if (key.length === 0) {
      this.setData({
        key: key,
        data: data,
        'dialog.hidden': false,
        'dialog.title': '读取数据失败',
        'dialog.content': 'key 不能为空'
      })
    } else {
      storageData = wx.getStorageSync(key)
      if (storageData === "") {
        this.setData({
          key: key,
          data: data,
          'dialog.hidden': false,
          'dialog.title': '读取数据失败',
          'dialog.content': '找不到 key 对应的数据'
        })
      } else {
        this.setData({
          key: key,
          data: data,
          'dialog.hidden': false,
          'dialog.title': '读取数据成功',
          'dialog.content': "data: '" + storageData + "'"
        })
      }
    }
  },
  setStorage: function () {
    var key = this.data.key
    var data = this.data.data
    if (key.length === 0) {
      this.setData({
        key: key,
        data: data,
        'dialog.hidden': false,
        'dialog.title': '保存数据失败',
        'dialog.content': 'key 不能为空'
      })
    } else {
      wx.setStorageSync(key, data)
      this.setData({
        key: key,
        data: data,
        'dialog.hidden': false,
        'dialog.title': '存储数据成功'
      })
    }
  },

  confirm: function () {
    this.setData({
      'dialog.hidden': true,
      'dialog.title': '',
      'dialog.content': ''
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})
var WxParse = require('components/wxParse/wxParse.js');
var util = require('utils/util.js');

App({
  onLaunch: function () {
    let userInfo;

    if (userInfo = wx.getStorageSync('userInfo')) {
      this.globalData.userInfo = userInfo;
    }
    this.appInitial();
  },
  appInitial: function () {
    let that = this;

    this._getSystemInfo({
      success: function (res) {
        that.setSystemInfoData(res);
      }
    });

    wx.request({
      url: this.globalData.siteBaseUrl + '/index.php?r=AppUser/MarkWxXcxStatus',
      data: {
        app_id: this.getAppId()
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      }
    });
  },








  onPageLoad: function (event) {
    let pageInstance = this.getAppCurrentPage();
    let detail = event.detail;
    let promotionName = event.promotionName;
    let that = this;

    pageInstance.setData({
      dataId: detail,
      addShoppingCartShow: false,
      addTostoreShoppingCartShow: false
    });
    this.setPageUserInfo();
    if (detail) {
      pageInstance.dataId = detail;
    }
    if (promotionName) {
      var userInfo = this.getUserInfo();
      this.setPageTitle(promotionName + '的小店');
    }
    if (!!pageInstance.carouselGroupidsParams) {
      for (let i in pageInstance.carouselGroupidsParams) {
        let compid = pageInstance.carouselGroupidsParams[i].compid;
        let deletePic = {};
        deletePic[compid + '.content'] = [];
        pageInstance.setData(deletePic);
      }
    }
    for (let i in pageInstance.data) {
      if (/^bbs[\d]+$/.test(i)) { //bbs滚动到底部加载数据,只能有一个
        pageInstance.reachBottomFuc = [{
          param: {
            compId: i
          },
          triggerFuc: function (param) {
            that._bbsScrollFuc(param.compId);
          }
        }];
      }
      if (/^list_vessel[\d]+$/.test(i)) { //动态列表滚动到底部加载数据,只能有一个
        let component = pageInstance.data[i];
        if (component.customFeature.vesselAutoheight == 1 && component.customFeature.loadingMethod == 0) {
          pageInstance.reachBottomFuc = [{
            param: component,
            triggerFuc: function (param) {
              that.pageScrollFunc(param.compId);
            }
          }];
        }
      }
      if (/^goods_list[\d]+$/.test(i)) { //商品列表滚动到底部加载数据,只能有一个
        let component = pageInstance.data[i];
        if (component.customFeature.vesselAutoheight == 1 && component.customFeature.loadingMethod == 0) {
          pageInstance.reachBottomFuc = [{
            param: component,
            triggerFuc: function (param) {
              that.goodsScrollFunc(param.compId);
            }
          }];
        }
      }
      if (/^seckill[\d]+$/.test(i)) { //秒杀列表滚动到底部加载数据,只能有一个
        let component = pageInstance.data[i];
        if (component.customFeature.vesselAutoheight == 1 && component.customFeature.loadingMethod == 0) {
          pageInstance.reachBottomFuc = [{
            param: component,
            triggerFuc: function (param) {
              that.seckillScrollFunc(param.compId);
            }
          }];
        }
      }
      if (/^video_list[\d]+$/.test(i)) { //秒杀列表滚动到底部加载数据,只能有一个
        let component = pageInstance.data[i];
        if (component.customFeature.vesselAutoheight == 1 && component.customFeature.loadingMethod == 0) {
          pageInstance.reachBottomFuc = [{
            param: component,
            triggerFuc: function (param) {
              that.videoScrollFunc(param.compId);
            }
          }];
        }
      }
    }

    pageInstance.dataInitial();
    pageInstance.suspensionBottom();
  },


  pageDataInitial: function () {
    let _this = this;
    let pageInstance = this.getAppCurrentPage();
    let pageRequestNum = pageInstance.requestNum;
    let newdata = {};

    if (!!pageInstance.dataId && !!pageInstance.page_form) {
      var dataid = parseInt(pageInstance.dataId);
      var param = {};

      param.data_id = dataid;
      param.form = pageInstance.page_form;

      pageInstance.requestNum = pageRequestNum + 1;
      _this.sendRequest({
        hideLoading: pageRequestNum++ == 1 ? false : true,
        url: '/index.php?r=AppData/getFormData',
        data: param,
        method: 'post',
        success: function (res) {
          if (res.status == 0) {
            let newdata = {};
            let formdata = res.data[0].form_data;

            for (let i in formdata) {
              if (i == 'category') {
                continue;
              }
              if (/region/.test(i)) {
                continue;
              }

              let description = formdata[i];
              if (_this.needParseRichText(description)) {
                formdata[i] = _this.getWxParseResult(description);
              }
            }
            newdata['detail_data'] = formdata;
            pageInstance.setData(newdata);

            if (!!pageInstance.dynamicVesselComps) {
              for (let i in pageInstance.dynamicVesselComps) {
                let vessel_param = pageInstance.dynamicVesselComps[i].param;
                let compid = pageInstance.dynamicVesselComps[i].compid;
                if (vessel_param.param_segment === 'id') {
                  vessel_param.idx = vessel_param.search_segment;
                  vessel_param.idx_value = pageInstance.dataId;
                } else if (!!newdata.detail_data[vessel_param.param_segment]) {
                  vessel_param.idx = vessel_param.search_segment;
                  vessel_param.idx_value = newdata.detail_data[vessel_param.param_segment];
                } else {
                  continue;
                }
                pageInstance.requestNum = pageRequestNum + 1;
                _this.sendRequest({
                  hideLoading: pageRequestNum++ == 1 ? false : true,
                  url: '/index.php?r=AppData/getFormDataList',
                  data: {
                    app_id: vessel_param.app_id,
                    form: vessel_param.form,
                    page: 1,
                    idx_arr: {
                      idx: vessel_param.idx,
                      idx_value: vessel_param.idx_value
                    }
                  },
                  method: 'post',
                  success: function (res) {
                    let newDynamicData = {};

                    if (!res.data.length) {
                      return;
                    }

                    if (param.form !== 'form') {
                      for (let j in res.data) {
                        for (let k in res.data[j].form_data) {
                          if (k == 'category') {
                            continue;
                          }
                          if (/region/.test(k)) {
                            continue;
                          }

                          let description = res.data[j].form_data[k];

                          if (_this.needParseRichText(description)) {
                            res.data[j].form_data[k] = _this.getWxParseResult(description);
                          }
                        }
                      }
                    }

                    newDynamicData[compid + '.list_data'] = res.data;
                    newDynamicData[compid + '.is_more'] = res.is_more;
                    newDynamicData[compid + '.curpage'] = res.current_page;
                    pageInstance.setData(newDynamicData);
                  },
                  fail: function () {
                    console.log("[fail info]dynamic-vessel data request  failed");
                  }
                });
              }
            }
          }
        },
        complete: function () {
          pageInstance.setData({
            page_hidden: false
          });
        }
      })
    } else {
      pageInstance.setData({
        page_hidden: false
      });
    }

    if (!!pageInstance.carouselGroupidsParams) {
      for (let i in pageInstance.carouselGroupidsParams) {
        let compid = pageInstance.carouselGroupidsParams[i].compid;
        let carouselgroupId = pageInstance.carouselGroupidsParams[i].carouselgroupId;
        let url = '/index.php?r=AppExtensionInfo/carouselPhotoProjiect';
        pageInstance.requestNum = pageRequestNum + 1;
        _this.sendRequest({
          hideLoading: pageRequestNum++ == 1 ? false : true,
          url: url,
          data: {
            type: carouselgroupId
          },
          method: 'post',
          success: function (res) {
            newdata = {};
            if (res.data.length) {
              let content = [];
              for (let j in res.data) {
                let form_data = JSON.parse(res.data[j].form_data);
                if (form_data.isShow == 1) {
                  let eventParams = {};
                  let eventHandler = "";
                  switch (form_data.action) {
                    case "goods-trade":
                      eventHandler = "tapGoodsTradeHandler";
                      eventParams = '{"goods_id":"' + form_data['goods-id'] + '","goods_type":"' + form_data['goods-type'] + '"}'
                      break;
                    case "inner-link":
                      eventHandler = "tapInnerLinkHandler";
                      let pageLink = form_data['page-link'];
                      let pageLinkPath = '/pages/' + pageLink + '/' + pageLink;
                      eventParams = '{"inner_page_link":"' + pageLinkPath + '","is_redirect":0}'
                      break;
                    case "call":
                      eventHandler = "tapPhoneCallHandler";
                      eventParams = '{"phone_num":"' + form_data['phone-num'] + '"}';
                      break;
                    case "get-coupon":
                      eventHandler = "tapGetCouponHandler";
                      eventParams = '{"coupon_id":"' + form_data['coupon-id'] + '"}';
                      break;
                    case "community":
                      eventHandler = "tapCommunityHandler";
                      eventParams = '{"community_id":"' + form_data['community-id'] + '"}';
                      break;
                    case "to-franchisee":
                      eventHandler = "tapToFranchiseeHandler";
                      eventParams = '{"franchisee_id":"' + form_data['franchisee-id'] + '"}';
                      break;
                    case "to-promotion":
                      eventHandler = "tapToPromotionHandler";
                      eventParams = "{}";
                      break;
                    case "coupon-receive-list":
                      eventHandler = "tapToCouponReceiveListHandler";
                      eventParams = "{}";
                      break;
                    case "recharge":
                      eventHandler = "tapToRechargeHandler";
                      eventParams = "{}";
                      break;
                    case 'lucky-wheel':
                      eventHandler = "tapToLuckyWheel";
                      eventParams = "{}";
                      break;
                    case 'golden-eggs':
                      eventHandler = "tapToGoldenEggs";
                      eventParams = "{}";
                      break;
                    case 'scratch-card':
                      eventHandler = "tapToScratchCard";
                      eventParams = "{}";
                      break;
                    case "video":
                      eventHandler = "tapVideoHandler";
                      eventParams = '{"video_id":"' + form_data['video-id'] + '","video_name":"' + form_data['video-name'] + '"}'
                      break;
                    case 'video-play':
                      eventHandler = "tapVideoPlayHandler";
                      eventParams = '{"video_id":"' + form_data['video-id'] + '","video_name":"' + form_data['video-name'] + '","compid":"' + compid + '"}'
                      break;
                    case 'transfer':
                      eventHandler = "tapToTransferPageHandler";
                      eventParams = '{}';
                      break;
                    case 'transfer':
                      eventHandler = "tapToTransferPageHandler";
                      eventParams = '{}';
                      break;
                    default:
                      eventHandler = "";
                      eventParams = "{}";
                  }
                  content.push({
                    "customFeature": [],
                    'page-link': form_data['page-link'],
                    'pic': form_data.pic,
                    "content": "",
                    "parentCompid": "carousel1",
                    "style": "",
                    eventHandler: eventHandler,
                    eventParams: eventParams
                  })
                }
              }
              newdata[compid + '.content'] = content;
              pageInstance.setData(newdata);
            }
          }
        });
      }
    }


    if (!!pageInstance.list_compids_params) {
      for (let i in pageInstance.list_compids_params) {
        let compid = pageInstance.list_compids_params[i].compid;
        let param = pageInstance.list_compids_params[i].param;
        let compData = pageInstance.data[compid];
        let url = '/index.php?r=AppData/getFormDataList';
        let customFeature = compData.customFeature;

        pageInstance.requestNum = pageRequestNum + 1;
        if (customFeature.vesselAutoheight == 1 && customFeature.loadingMethod == 1) {
          param.page_size = customFeature.loadingNum || 10;
        }
        _this.sendRequest({
          hideLoading: pageRequestNum++ == 1 ? false : true,
          url: url,
          data: param,
          method: 'post',
          success: function (res) {
            if (res.status == 0) {
              newdata = {};

              if (param.form !== 'form') {
                for (let j in res.data) {
                  for (let k in res.data[j].form_data) {
                    if (k == 'category') {
                      continue;
                    }
                    if (/region/.test(k)) {
                      continue;
                    }

                    let description = res.data[j].form_data[k];

                    if (_this.needParseRichText(description)) {
                      res.data[j].form_data[k] = _this.getWxParseResult(description);
                    }
                  }
                }
              }

              newdata[compid + '.list_data'] = res.data;
              newdata[compid + '.is_more'] = res.is_more;
              newdata[compid + '.curpage'] = 1;

              pageInstance.setData(newdata);
            }
          }
        });
      }
    }

    if (!!pageInstance.goods_compids_params) {
      for (let i in pageInstance.goods_compids_params) {
        let compid = pageInstance.goods_compids_params[i].compid;
        let param = pageInstance.goods_compids_params[i].param;
        let compData = pageInstance.data[compid];
        let customFeature = compData.customFeature;
        let newWaimaiData = {};
        newWaimaiData[compid + '.goodsDetailShow'] = false;
        newWaimaiData[compid + '.goodsModelShow'] = false;
        pageInstance.setData(newWaimaiData);
        if (param.form === 'takeout') {
          _this.getLocation({
            success: function (res) {
              param.longitude = res.longitude;
              param.latitude = res.latitude;
              param.page = 1;
              param.page_size = 50;
              let newWaimaiData = {};
              for (let j in compData.content) {
                newWaimaiData[compid + '.pagination.category' + compData.content[j].source] = {};
                newWaimaiData[compid + '.pagination.category' + compData.content[j].source].param = {},
                  Object.assign(newWaimaiData[compid + '.pagination.category' + compData.content[j].source].param, param)
                newWaimaiData[compid + '.pagination.category' + compData.content[j].source].param.idx_arr = {
                  idx: 'category',
                  idx_value: compData.content[j].source == 'all' ? '' : compData.content[j].source
                };
              }
              pageInstance.setData(newWaimaiData);
              param.idx_arr = {
                idx: 'category',
                idx_value: compData.content[0].source == 'all' ? '' : compData.content[0].source
              }
              pageInstance.requestNum = pageRequestNum + 1;
              _this.sendRequest({
                hideLoading: pageRequestNum++ == 1 ? false : true,
                url: '/index.php?r=AppShop/getTakeOutInfo',
                data: {},
                success: function (data) {
                  let _data = pageInstance.data;
                  let newdata = {};
                  newdata[compid + '.shopInfo'] = data.data;
                  newdata[compid + '.assessScore'] = (data.data.commont_stat.average_score).toFixed(2);
                  newdata[compid + '.goodsScore'] = Math.round(data.data.commont_stat.score);
                  newdata[compid + '.serviceScore'] = Math.round(data.data.commont_stat.logistic_score);
                  newdata[compid + '.heightPx'] = _this._returnListHeight(pageInstance.data[compid].customFeature.showShopInfo)
                  pageInstance.setData(newdata)
                }
              });
              pageInstance.requestNum = pageRequestNum + 1;
              _this._getTakeoutStyleGoodsList(param, pageInstance, compid);
              _this.sendRequest({
                hideLoading: true,
                url: '/index.php?r=AppShop/getAssessList&idx_arr[idx]=goods_type&idx_arr[idx_value]=2',
                data: { page: 1, page_size: 10, obj_name: 'app_id' },
                success: function (res) {
                  let newdata = {},
                    showAssess = [],
                    hasImgAssessList = 0,
                    goodAssess = 0,
                    normalAssess = 0,
                    badAssess = 0;
                  for (var i = 0; i < res.data.length; i++) {
                    res.data[i].assess_info.has_img == 1 ? (hasImgAssessList++ , showAssess.push(res.data[i])) : null;
                    res.data[i].assess_info.level == 3 ? goodAssess++ : (res.data[i].assess_info.level == 1 ? badAssess++ : normalAssess++)
                  }
                  for (let j = 0; j < res.num.length; j++) {
                    res.num[j] = parseInt(res.num[j])
                  }
                  newdata[compid + '.assessActive'] = 0;
                  newdata[compid + '.assessList'] = res.data;
                  newdata[compid + '.showAssess'] = showAssess;
                  newdata[compid + '.assessNum'] = res.num;
                  newdata[compid + '.moreAssess'] = res.is_more;
                  newdata[compid + '.assessCurrentPage'] = res.current_page;
                  pageInstance.setData(newdata);
                }
              })
            }
          });
        } else if (param.form === 'tostore') {
          _this.getTostoreCartList();

          if (customFeature.vesselAutoheight == 1 && customFeature.loadingMethod == 1) {
            param.page_size = customFeature.loadingNum || 20;
          }
          pageInstance.requestNum = pageRequestNum + 1;
          _this.sendRequest({
            hideLoading: pageRequestNum++ == 1 ? false : true,
            url: '/index.php?r=AppShop/GetGoodsList',
            data: param,
            method: 'post',
            success: function (res) {
              if (res.status == 0) {
                newdata = {};
                var arr = [];
                for (var i = 0; i < res.data.length; i++) {
                  var data = res.data[i],
                    maxMinArr = [],
                    pri = '';
                  if (data.form_data.goods_model && (data.form_data.goods_model.length >= 2)) {
                    for (var j = 0; j < data.form_data.goods_model.length; j++) {
                      maxMinArr.push(data.form_data.goods_model[j].price);
                    }
                    if (Math.min.apply(null, maxMinArr) != Math.max.apply(null, maxMinArr)) {
                      pri = Math.min.apply(null, maxMinArr).toFixed(2) + '-' + Math.max.apply(null, maxMinArr).toFixed(2);
                      data.form_data.price = pri;
                    }
                  }
                  arr.push(data);
                }
                if (_this.getHomepageRouter() == pageInstance.page_router) {
                  var second = new Date().getMinutes().toString();
                  if (second.length <= 1) {
                    second = '0' + second;
                  }
                  var currentTime = new Date().getHours().toString() + second,
                    showFlag = true,
                    showTime = '';

                  pageInstance.requestNum = pageRequestNum + 1;
                  _this.sendRequest({
                    hideLoading: pageRequestNum++ == 1 ? false : true,
                    url: '/index.php?r=AppShop/getBusinessTime',
                    method: 'post',
                    data: {
                      app_id: _this.getAppId()
                    },
                    success: function (res) {
                      var businessTime = res.data.business_time;
                      if (businessTime) {
                        for (var i = 0; i < businessTime.length; i++) {
                          showTime += businessTime[i].start_time.substring(0, 2) + ':' + businessTime[i].start_time.substring(2, 4) + '-' + businessTime[i].end_time.substring(0, 2) + ':' + businessTime[i].end_time.substring(2, 4) + ' / ';
                          if (+currentTime > +businessTime[i].start_time && +currentTime < +businessTime[i].end_time) {
                            showFlag = false;
                          }
                        }
                        if (showFlag) {
                          showTime = showTime.substring(0, showTime.length - 2);
                          _this.showModal({
                            content: '店铺休息中,暂时无法接单。营业时间为：' + showTime
                          })
                        }
                      }
                    }
                  });
                }
                newdata[compid + '.goods_data'] = arr;
                newdata[compid + '.is_more'] = res.is_more;
                newdata[compid + '.curpage'] = 1;
                pageInstance.setData(newdata);
              }
            }
          });
        } else {
          if (customFeature.vesselAutoheight == 1 && customFeature.loadingMethod == 1) {
            param.page_size = customFeature.loadingNum || 20;
          }
          pageInstance.requestNum = pageRequestNum + 1;
          _this.sendRequest({
            hideLoading: pageRequestNum++ == 1 ? false : true,
            url: '/index.php?r=AppShop/GetGoodsList',
            data: param,
            method: 'post',
            success: function (res) {
              if (res.status == 0) {
                newdata = {};
                newdata[compid + '.goods_data'] = res.data;
                newdata[compid + '.is_more'] = res.is_more;
                newdata[compid + '.curpage'] = 1;
                pageInstance.setData(newdata);
              }
            }
          });
        }
      }
    }
    if (!!pageInstance.franchiseeComps) {
      for (let i in pageInstance.franchiseeComps) {
        let compid = pageInstance.franchiseeComps[i].compid;
        let param = pageInstance.franchiseeComps[i].param;

        _this.getLocation({
          success: function (res) {
            var latitude = res.latitude,
              longitude = res.longitude;

            pageInstance.requestNum = pageRequestNum + 1;
            _this.sendRequest({
              hideLoading: pageRequestNum++ == 1 ? false : true,
              url: '/index.php?r=Region/GetAreaInfoByLatAndLng',
              data: {
                latitude: latitude,
                longitude: longitude
              },
              success: function (res) {
                newdata = {};
                newdata[compid + '.location_address'] = res.data.addressComponent.street + res.data.sematic_description;
                pageInstance.setData(newdata);

                param.latitude = latitude;
                param.longitude = longitude;
                param.page = -1;
                _this.setLocationInfo({
                  latitude: latitude,
                  longitude: longitude,
                  address: res.data.addressComponent.street + res.data.sematic_description
                });
                pageInstance.requestNum = pageRequestNum + 1;
                _this.sendRequest({
                  hideLoading: pageRequestNum++ == 1 ? false : true,
                  url: '/index.php?r=AppShop/GetAppShopByPage',
                  data: param,
                  method: 'post',
                  success: function (res) {
                    for (let index in res.data) {
                      let distance = res.data[index].distance;
                      res.data[index].distance = util.formatDistance(distance);
                    }

                    newdata = {};
                    newdata[compid + '.franchisee_data'] = res.data;
                    newdata[compid + '.is_more'] = res.is_more;
                    newdata[compid + '.curpage'] = 1;

                    pageInstance.setData(newdata);
                  }
                });
              }
            });
          }
        });
      }
    }


    if (!!pageInstance.relobj_auto) {
      for (let i in pageInstance.relobj_auto) {
        let obj = pageInstance.relobj_auto[i],
          objrel = obj.obj_rel,
          AutoAddCount = obj.auto_add_count,
          compid = obj.compid,
          hasCounted = obj.has_counted,
          parentcompid = obj.parentcompid;

        if (parentcompid != '' && parentcompid != null) {
          if (compid.search('data.') !== -1) {
            compid = compid.substr(5);
          }
          compid = parentcompid + '.' + compid;
        }

        if (!!pageInstance.dataId && !!pageInstance.page_form) {
          objrel = pageInstance.page_form + '_' + pageInstance.dataId;

          if (AutoAddCount) {
            objrel = objrel + '_view';
          }
        }

        pageInstance.requestNum = pageRequestNum + 1;
        _this.sendRequest({
          hideLoading: pageRequestNum++ == 1 ? false : true,
          url: '/index.php?r=AppData/getCount',
          data: {
            obj_rel: objrel
          },
          success: function (res) {
            if (res.status == 0) {
              if (AutoAddCount == 1) {
                if (hasCounted == 0) {
                  pageInstance.requestNum = pageRequestNum + 1;
                  _this.sendRequest({
                    hideLoading: pageRequestNum++ == 1 ? false : true,
                    url: '/index.php?r=AppData/addCount',
                    data: {
                      obj_rel: objrel
                    },
                    success: function (newres) {
                      if (newres.status == 0) {
                        newdata = {};
                        newdata[compid + '.count_data.count_num'] = parseInt(newres.data.count_num);
                        newdata[compid + '.count_data.has_count'] = parseInt(newres.data.has_count);
                        pageInstance.setData(newdata);
                      }
                    },
                    fail: function () {
                    }
                  });
                }
              } else {
                newdata = {};
                newdata[compid + '.count_data.count_num'] = parseInt(res.data.count_num);
                newdata[compid + '.count_data.has_count'] = parseInt(res.data.has_count);
                pageInstance.setData(newdata);
              }
            }
          }
        });
      }
    }

    if (pageInstance.bbsCompIds.length) {
      for (let i in pageInstance.bbsCompIds) {
        let compid = pageInstance.bbsCompIds[i],
          bbsData = pageInstance.data[compid],
          bbs_idx_value = '';

        if (bbsData.customFeature.ifBindPage && bbsData.customFeature.ifBindPage !== 'false') {
          if (pageInstance.page_form && pageInstance.page_form != 'none') {
            bbs_idx_value = pageInstance.page_form + '_' + pageInstance.dataId;
          } else {
            bbs_idx_value = pageInstance.page_router;
          }
        } else {
          bbs_idx_value = _this.getAppId();
        }
        pageInstance.requestNum = pageRequestNum + 1;
        _this.sendRequest({
          hideLoading: pageRequestNum++ == 1 ? false : true,
          url: '/index.php?r=AppData/getFormDataList',
          method: 'post',
          data: {
            form: 'bbs',
            is_count: bbsData.customFeature.ifLike ? 1 : 0,
            page: 1,
            idx_arr: {
              idx: 'rel_obj',
              idx_value: bbs_idx_value
            }
          },
          success: function (res) {
            let data = {};

            res.isloading = false;

            data[compid + '.content'] = res;
            data[compid + '.comment'] = {};
            pageInstance.setData(data);
          }
        });
      }
    }
    if (!!pageInstance.communityComps) {
      for (let i in pageInstance.communityComps) {
        let compid = pageInstance.communityComps[i].compid,
          dataId = [],
          content = pageInstance.data[compid].content,
          customFeature = pageInstance.data[compid].customFeature,
          styleData = {},
          imgStyle = [],
          liStyle = [],
          secStyle = [];

        secStyle = [
          'color:' + customFeature.secColor,
          'text-decoration:' + (customFeature.secTextDecoration || 'none'),
          'text-align:' + (customFeature.secTextAlign || 'left'),
          'font-size:' + customFeature.secFontSize,
          'font-style:' + (customFeature.secFontStyle || 'normal'),
          'font-weight:' + (customFeature.secFontWeight || 'normal')
        ].join(";");

        imgStyle = [
          'width :' + (customFeature.imgWidth * 2.34) + 'rpx',
          'height :' + (customFeature.imgHeight * 2.34) + 'rpx'
        ].join(";");
        liStyle = [
          'height :' + (customFeature.lineHeight * 2.34) + 'rpx',
          'margin-bottom :' + (customFeature.margin * 2.34) + 'rpx'
        ];
        customFeature['lineBackgroundColor'] && (liStyle.push('background-color:' + customFeature['lineBackgroundColor']));
        customFeature['lineBackgroundImage'] && (liStyle.push('background-image:' + customFeature['lineBackgroundImage']));
        liStyle = liStyle.join(";");

        styleData[compid + '.secStyle'] = secStyle;
        styleData[compid + '.imgStyle'] = imgStyle;
        styleData[compid + '.liStyle'] = liStyle;
        pageInstance.setData(styleData);

        for (let j in content) {
          dataId.push(content[j]['community-id']);
        }

        pageInstance.requestNum = pageRequestNum + 1;
        _this.sendRequest({
          hideLoading: pageRequestNum++ == 1 ? false : true,
          url: '/index.php?r=AppSNS/GetSectionByPage',
          data: {
            section_ids: dataId,
            page: 1,
            page_size: 100
          },
          method: 'post',
          success: function (res) {
            if (res.status == 0) {
              var ddata = {},
                lastdata = [],
                newdata = {};

              for (let x = 0; x < res.data.length; x++) {
                let val = res.data[x];
                ddata[val.id] = val;
              }
              for (let y = 0; y < dataId.length; y++) {
                let val = ddata[dataId[y]];
                if (val) {
                  lastdata.push(val);
                }
              }
              newdata[compid + '.community_data'] = lastdata;

              pageInstance.setData(newdata);
            }
          }
        });
      }
    }

    if (pageInstance.cityLocationComps.length) {
      for (let i in pageInstance.cityLocationComps) {
        pageInstance.data[pageInstance.cityLocationComps[i]].hidden = false;
        _this.getLocation({
          success: function (res) {
            var latitude = res.latitude,
              longitude = res.longitude;

            pageInstance.requestNum = pageRequestNum + 1;
            _this.sendRequest({
              hideLoading: pageRequestNum++ == 1 ? false : true,
              url: '/index.php?r=Region/GetAreaInfoByLatAndLng',
              data: {
                latitude: latitude,
                longitude: longitude
              },
              success: function (res) {
                var newdata = pageInstance.data,
                  id = pageInstance.cityLocationComps[i];

                newdata[id].provinces = [];
                newdata[id].provinces_ids = [];
                newdata[id].province = '';
                newdata[id].citys = [];
                newdata[id].city_ids = [];
                newdata[id].city = '';
                newdata[id].districts = [];
                newdata[id].district_ids = [];
                newdata[id].district = '';
                newdata[id].value = [0, 0, 0];
                newdata[id].local = res.data.addressComponent.province + ' ' + res.data.addressComponent.city + ' ' + res.data.addressComponent.district + ' >';
                pageInstance.setData(newdata);
              }
            })
          }
        });
        pageInstance.requestNum = pageRequestNum + 1;
        _this.sendRequest({
          hideLoading: pageRequestNum++ == 1 ? false : true,
          url: '/index.php?r=AppRegion/getAllExistedDataRegionList&is_xcx=1',
          success: function (data) {
            var newdata = pageInstance.data,
              id = pageInstance.cityLocationComps[i];
            newdata[id].areaList = data.data;
            pageInstance.setData(newdata);
          },
        });
      }
    }

    if (!!pageInstance.seckillOnLoadCompidParam) {
      for (let i in pageInstance.seckillOnLoadCompidParam) {
        let compid = pageInstance.seckillOnLoadCompidParam[i].compid;
        let param = pageInstance.seckillOnLoadCompidParam[i].param;
        let compData = pageInstance.data[compid];
        let customFeature = compData.customFeature;

        param.page_size = 10;
        if (customFeature.vesselAutoheight == 1 && customFeature.loadingMethod == 1) {
          param.page_size = customFeature.loadingNum || 10;
        }

        param.is_seckill = 1;
        pageInstance.requestNum = pageRequestNum + 1;
        _this.sendRequest({
          hideLoading: pageRequestNum++ == 1 ? false : true,
          url: '/index.php?r=AppShop/GetGoodsList',
          data: param,
          method: 'post',
          success: function (res) {
            if (res.status == 0) {
              let rdata = res.data,
                newdata = {},
                downcountArr = pageInstance.data.downcountArr || [];

              for (let i = 0; i < rdata.length; i++) {
                let f = rdata[i].form_data,
                  dc;

                f.downCount = {
                  hours: '00',
                  minutes: '00',
                  seconds: '00'
                };
                if (f.seckill_start_state == 0) {
                  dc = _this.beforeSeckillDownCount(f, pageInstance, compid + '.goods_data[' + i + '].form_data');
                } else if (f.seckill_start_state == 1) {
                  dc = _this.duringSeckillDownCount(f, pageInstance, compid + '.goods_data[' + i + '].form_data');
                }
                downcountArr.push(dc);
              }

              newdata[compid + '.goods_data'] = res.data;

              newdata[compid + '.is_more'] = res.is_more;
              newdata[compid + '.curpage'] = 1;
              newdata.downcountArr = downcountArr;

              pageInstance.setData(newdata);
            }
          }
        });
      }
    }
    // 动态分类组件
    if (!!pageInstance.dynamicClassifyGroupidsParams) {
      let params = pageInstance.dynamicClassifyGroupidsParams;
      for (let i = 0; i < params.length; i++) {
        let compId = params[i]['compid'];
        let groupId = params[i]['dynamicClassifyGroupId'];
        let compData = pageInstance.data[compId];
        let classifyLevel = compData.classifyType.charAt(5);
        let customFeature = compData.customFeature;
        _this.sendRequest({
          hideLoading: true,
          url: '/index.php?r=appData/getCategoryByGroup',
          data: {
            group_id: groupId
          },
          success: function (res) {
            // 设置分类区域数据
            let classifyData = res.data.item;
            let newData = {};
            let currentCategory = [];
            if (classifyLevel == 1 && classifyData[0]) {
              currentCategory.push(classifyData[0]['category_id']);
            } else if (classifyLevel == 2 && classifyData[0]) {
              // 二级竖版带图的动态分类组件没有“全部”
              if (compData.classifyType == 'level2-vertical-withpic') {
                classifyData = classifyData.filter(function (item) {
                  return item.category_id != '';
                })
              }
              currentCategory.push(classifyData[0]['category_id']);
              if (classifyData[0]['subclass'][0]) {
                currentCategory.push(classifyData[0]['subclass'][0]['category_id']);
              }
            }
            newData[compId + '.classifyData'] = classifyData;
            newData[compId + '.classifyGroupForm'] = res.data.form;
            newData[compId + '.currentCategory'] = currentCategory;
            pageInstance.setData(newData);
            if (classifyLevel == 1 && currentCategory.length < 1) {
              return;
            } else if (classifyLevel == 2 && currentCategory.length < 2) {
              if (currentCategory.length == 1) {
                currentCategory[1] = currentCategory[0];
              } else {
                return;
              }
            }
            if (compData.classifyType == 'level2-vertical-withpic') {
              return;
            }
            // 根据groupId请求第一个分类绑定的数据
            let param = {
              page: 1,
              form: res.data.form,
              idx_arr: {
                idx: 'category',
                idx_value: currentCategory[classifyLevel - 1]
              }
            };
            if (customFeature.vesselAutoheight == 1 && customFeature.loadingMethod == 1) {
              param.page_size = customFeature.loadingNum || 20;
            }
            _this.sendRequest({
              hideLoading: true,   // 页面第一个请求才展示loading
              url: '/index.php?r=AppData/getFormDataList',
              data: param,
              method: 'post',
              success: function (res) {
                if (res.status == 0) {
                  newdata = {};
                  if (param.form !== 'form') { // 动态列表绑定表单则不调用富文本解析
                    for (let j in res.data) {
                      for (let k in res.data[j].form_data) {
                        if (k == 'category') {
                          continue;
                        }
                        if (/region/.test(k)) {
                          continue;
                        }

                        let description = res.data[j].form_data[k];

                        // 检测如果不是一个图片链接的话就解析
                        if (_this.needParseRichText(description)) {
                          res.data[j].form_data[k] = _this.getWxParseResult(description);
                        }
                      }
                    }
                  }
                  newdata[compId + '.list_data'] = res.data;
                  newdata[compId + '.is_more'] = res.is_more;
                  newdata[compId + '.curpage'] = 1;
                  pageInstance.setData(newdata);
                }
              }
            });

          }
        });
      }
    }

    // 视频列表
    if (!!pageInstance.videoListComps.length) {
      for (let i in pageInstance.videoListComps) {
        let compid = pageInstance.videoListComps[i].compid;
        let param = pageInstance.videoListComps[i].param;
        let compData = pageInstance.data[compid];
        let customFeature = compData.customFeature;

        if (customFeature.vesselAutoheight == 1 && customFeature.loadingMethod == 1) {
          param.page_size = customFeature.loadingNum || 10;
        }

        pageInstance.requestNum = pageRequestNum + 1;
        _this.sendRequest({
          hideLoading: pageRequestNum++ == 1 ? false : true,   // 页面第一个请求才展示loading
          url: '/index.php?r=AppVideo/GetVideoList',
          data: param,
          method: 'post',
          success: function (res) {
            if (res.status == 0) {
              let rdata = res.data,
                newdata = {};

              for (var i = 0; i < rdata.length; i++) {
                rdata[i].video_view = _this.handlingNumber(rdata[i].video_view);
              }

              newdata[compid + '.video_data'] = rdata;

              newdata[compid + '.is_more'] = res.is_more;
              newdata[compid + '.curpage'] = 1;

              pageInstance.setData(newdata);
            }
          }
        });
      }
    }
    // 单个视频组件
    if (!!pageInstance.videoProjectComps.length) {
      for (let i in pageInstance.videoProjectComps) {
        let compid = pageInstance.videoProjectComps[i].compid;
        let videoProjectId = pageInstance.videoProjectComps[i].videoProjectId;

        pageInstance.requestNum = pageRequestNum + 1;
        _this.sendRequest({
          hideLoading: pageRequestNum++ == 1 ? false : true,   // 页面第一个请求才展示loading
          url: '/index.php?r=AppVideo/GetProjectInfo',
          data: {
            id: videoProjectId
          },
          method: 'post',
          success: function (res) {
            if (res.status == 0) {
              let rdata = res.data,
                newdata = {};

              newdata[compid + '.videoInfo'] = rdata;
              // newdata[compid + '.videoPosterHidden'] = false;

              pageInstance.setData(newdata);

              setTimeout(function () {
                let timeoutData = {};
                timeoutData[compid + '.videoPosterHidden'] = false;

                pageInstance.setData(timeoutData);
              }, 2000)
            }
          }
        });
      }
    }
  },

  _getTakeoutStyleGoodsList: function (param, pageInstance, compid, isOnShow) {
    let _this = this;
    this.sendRequest({
      hideLoading: true,   // 页面第一个请求才展示loading
      url: '/index.php?r=AppShop/GetGoodsList',
      data: param,
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          pageInstance.requesting = false;
          let categoryId = param.idx_arr.idx_value == '' ? 'all' : param.idx_arr.idx_value;
          var data = pageInstance.data,
            newdata = {},
            isRequireing = {},
            categoryList = {},
            takeoutGoodsModelData = {};
          isRequireing[compid + '.pagination.category' + param.idx_arr.idx_value + '.requesting'] = false;
          pageInstance.setData(isRequireing);
          if (!data[compid].show_goods_data || (data[compid].show_goods_data && !data[compid].show_goods_data['category' + categoryId]) || isOnShow) {
            categoryList['category' + categoryId] = []
          } else {
            categoryList['category' + categoryId] = data[compid].show_goods_data['category' + categoryId]
          }
          for (let i in res.data) {
            let form_data = res.data[i].form_data
            categoryList['category' + categoryId].push({
              app_id: form_data.app_id,
              cover: form_data.cover,
              description: form_data.description,
              goods_model: form_data.goods_model,
              id: form_data.id,
              model: form_data.model,
              price: form_data.price,
              sales: form_data.sales,
              title: form_data.title,
              business_time: form_data.business_time,
              is_in_business_time: form_data.goods_in_business_time
            });
            newdata[compid + '.goods_model_list.goods' + form_data.id] = {};
            newdata[compid + '.goods_data_list.goods' + form_data.id] = {
              totalNum: 0,
              stock: form_data.stock,
              goods_model: {},
              name: form_data.title,
              price: form_data.price
            }
            if (form_data.goods_model) {
              let new_goods_model = {}
              for (let i in form_data.goods_model) {
                new_goods_model[form_data.goods_model[i].id] = {
                  model: form_data.goods_model[i].model,
                  stock: form_data.goods_model[i].stock,
                  price: form_data.goods_model[i].price,
                  goods_id: form_data.goods_model[i].goods_id,
                  totalNum: 0
                }
              }
              newdata[compid + '.goods_model_list.goods' + form_data.id] = {
                modelData: [],
                name: form_data.title,
                goods_model: new_goods_model
              }
              for (let k in form_data.model) {
                newdata[compid + '.goods_model_list.goods' + form_data.id]['modelData'].push({
                  name: form_data.model[k].name,
                  subModelName: form_data.model[k].subModelName,
                  subModelId: form_data.model[k].subModelId
                })
              }
            } else {
              newdata[compid + '.goods_model_list.goods' + form_data.id][0] = {
                price: form_data.price,
                num: 0,
                stock: form_data.stock,
                price: form_data.price
              }
            }
          }
          newdata[compid + '.show_goods_data.category' + categoryId] = categoryList['category' + categoryId];
          // newdata[compid + '.goods_data_list'] = takeoutGoodsListData;
          // newdata[compid + '.goods_model_list'] = takeoutGoodsModelData;
          newdata[compid + '.in_distance'] = res.in_distance;
          newdata[compid + '.in_business_time'] =

            res.in_business_time;
          // console.log(takeoutGoodsModelData);
          if (data[compid].TotalNum == undefined) {
            newdata[compid + '.TotalNum'] = 0;
            newdata[compid + '.TotalPrice'] = 0.00;
          }
          newdata[compid + '.selected'] = 1;
          newdata[compid + '.cartList'] = {};
          newdata[compid + '.pagination.category' + categoryId] = data[compid].pagination['category' + categoryId];
          newdata[compid + '.pagination.category' + categoryId].param = param;
          newdata[compid + '.pagination.category' + categoryId].is_more = res.is_more;
          newdata[compid + '.pagination.category' + categoryId].current_page = res.current_page;
          newdata[compid + '.modelChoose'] = [];
          newdata[compid + '.modelChooseId'] = [];
          pageInstance.setData(newdata);
          if (pageInstance.data[compid].cartTakeoutStyleList) {
            _this._parseTakeoutCartListData(pageInstance.data[compid].cartlistData, pageInstance, compid)
          } else {
            _this._getTakeoutStyleCartList(pageInstance, compid)
          }
        }
      }
    });
  },
  _getTakeoutStyleCartList: function (pageInstance, compid) {
    let _this = this;
    this.sendRequest({
      hideLoading: true,   // 页面第一个请求才展示loading
      url: '/index.php?r=AppShop/cartList',
      data: { page: -1, sub_shop_app_id: '', parent_shop_app_id: '' },
      success: function (cartlist) {
        if (cartlist.status == 0) {
          _this._parseTakeoutCartListData(cartlist, pageInstance, compid)
        }
      }
    })
  },







  bindDateChange: function (event) {
    let dataset = event.currentTarget.dataset;
    let value = event.detail.value;
    let pageInstance = this.getAppCurrentPage();
    let datakey = dataset.datakey;
    let compid = dataset.compid;
    let formcompid = dataset.formcompid;
    let segment = dataset.segment;
    let newdata = {};

    compid = formcompid + compid.substr(4);

    if (!segment) {
      this.showModal({
        content: '该组件未绑定字段 请在电脑编辑页绑定后使用'
      });
      return;
    }

    let obj = pageInstance.data[formcompid]['form_data'];
    if (util.isPlainObject(obj)) {
      obj = pageInstance.data[formcompid]['form_data'] = {};
    }
    obj = obj[segment];

    if (!!obj) {
      let date = obj.substr(0, 10);
      let time = obj.substr(11);

      if (obj.length == 16) {
        newdata[datakey] = value + ' ' + time;
      } else if (obj.length == 10) {
        newdata[datakey] = value;
      } else if (obj.length == 5) {
        newdata[datakey] = value + ' ' + obj;
      } else if (obj.length == 0) {
        newdata[datakey] = value;
      }
    } else {
      newdata[datakey] = value;
    }
    newdata[compid + '.date'] = value;
    pageInstance.setData(newdata);
  },



  bindSelectChange: function (event) {
    let dataset = event.currentTarget.dataset;
    let value = event.detail.value;
    let pageInstance = this.getAppCurrentPage();
    let datakey = dataset.datakey;
    let segment = dataset.segment;

    if (!segment) {
      this.showModal({
        content: '该组件未绑定字段 请在电脑编辑页绑定后使用'
      });
      return;
    }
    var newdata = {};
    newdata[datakey] = value;
    pageInstance.setData(newdata);
  },

  bindScoreChange: function (event) {
    let dataset = event.currentTarget.dataset;
    let pageInstance = this.getAppCurrentPage();
    let datakey = dataset.datakey;
    let value = dataset.score;
    let compid = dataset.compid;
    let formcompid = dataset.formcompid;
    let segment = dataset.segment;

    compid = formcompid + compid.substr(4);

    if (!segment) {
      this.showModal({
        content: '该组件未绑定字段 请在电脑编辑页绑定后使用'
      });
      return;
    }
    var newdata = {};
    newdata[datakey] = value;
    newdata[compid + '.editScore'] = value;
    pageInstance.setData(newdata);
  },




  /**
   *  全局参数get、set部分 start
   *  
   */

  // 获取首页router
  getHomepageRouter: function () {
    return this.globalData.homepageRouter;
  },
  getAppId: function () {
    return this.globalData.appId;
  },
  getDefaultPhoto: function () {
    return this.globalData.defaultPhoto;
  },
  getSessionKey: function () {
    return this.globalData.sessionKey;
  },
  setSessionKey: function (session_key) {
    this.globalData.sessionKey = session_key;
    this.setStorage({
      key: 'session_key',
      data: session_key
    })
  },
  getUserInfo: function () {
    return this.globalData.userInfo;
  },
  setUserInfoStorage: function (info) {
    for (var key in info) {
      this.globalData.userInfo[key] = info[key];
    }
    this.setStorage({
      key: 'userInfo',
      data: this.globalData.userInfo
    })
  },
  setPageUserInfo: function () {
    let currentPage = this.getAppCurrentPage();
    let newdata = {};

    newdata['userInfo'] = this.getUserInfo();
    currentPage.setData(newdata);
  },
  getAppCurrentPage: function () {
    var pages = getCurrentPages();
    return pages[pages.length - 1];
  },
  getTabPagePathArr: function () {
    return JSON.parse(this.globalData.tabBarPagePathArr);
  },
  getWxParseOldPattern: function () {
    return this.globalData.wxParseOldPattern;
  },
  getWxParseResult: function (data, setDataKey) {
    var page = this.getAppCurrentPage();
    data = typeof data == 'number' ? '' + data : data;
    return WxParse.wxParse(setDataKey || this.getWxParseOldPattern(), 'html', data, page);
  },
  getAppTitle: function () {
    return this.globalData.appTitle;
  },
  getAppDescription: function () {
    return this.globalData.appDescription;
  },
  setLocationInfo: function (info) {
    this.globalData.locationInfo = info;
  },
  getLocationInfo: function () {
    return this.globalData.locationInfo;
  },
  getSiteBaseUrl: function () {
    return this.globalData.siteBaseUrl;
  },
  getUrlLocationId: function () {
    return this.globalData.urlLocationId;
  },
  getPreviewGoodsInfo: function () {
    return this.globalData.previewGoodsOrderGoodsInfo;
  },
  setPreviewGoodsInfo: function (goodsInfoArr) {
    this.globalData.previewGoodsOrderGoodsInfo = goodsInfoArr;
  },
  getGoodsAdditionalInfo: function () {
    return this.globalData.goodsAdditionalInfo;
  },
  setGoodsAdditionalInfo: function (additionalInfo) {
    this.globalData.goodsAdditionalInfo = additionalInfo;
  },
  getIsLogin: function () {
    return this.globalData.isLogin;
  },
  setIsLogin: function (isLogin) {
    this.globalData.isLogin = isLogin;
  },
  getSystemInfoData: function () {
    let res;
    if (this.globalData.systemInfo) {
      return this.globalData.systemInfo;
    }
    try {
      res = this.getSystemInfoSync();
      this.setSystemInfoData(res);
    } catch (e) {
      this.showModal({
        content: '获取系统信息失败 请稍后再试'
      })
    }
    return res || {};
  },
  setSystemInfoData: function (res) {
    this.globalData.systemInfo = res;
  },

  globalData: {
    appId: 'tca3A534kT',
    tabBarPagePathArr: '[]',
    homepageRouter: 'match',
    formData: null,
    userInfo: {},
    systemInfo: null,
    sessionKey: '',
    notBindXcxAppId: false,
    waimaiTotalNum: 0,
    waimaiTotalPrice: 0,
    takeoutShopInfo: {},
    takeoutRefresh: false,
    isLogin: false,
    locationInfo: {
      latitude: '',
      longitude: '',
      address: ''
    },


  }
})


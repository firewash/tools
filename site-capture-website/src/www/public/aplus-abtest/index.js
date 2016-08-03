'use strict';
/**
 * AB测试模块, 用于前端随机分桶
 * @author: 昊川
 * @数据接口人: 笙安
 *
 * AB测试行为准则
 * 一、不可变
 *  一个用户如果访问了版本A，那么直到AB测试结束他都该访问版本A。
 * 二、可复现
 *  基于第一点，AB测试是不可变的。因此，对于内部人员来说是不灵活的。
 *  我们应该基于url传参的方式控制展现版本，做到可复现。
 */

var _head_node;
var _meta_nodes;

function tryToGetAttribute(element, attr_name) {
  return element && element.getAttribute ? (element.getAttribute(attr_name) || '') : '';
}

/**
 * 取得页面上 head 中的所有 meta 元素
 * @param [force] {boolean} 是否强制获取新内容
 */
function getMetaTags(force) {

  var doc = document;
  _head_node = _head_node || doc.getElementsByTagName('head')[0];
  if (_meta_nodes && !force) {
    return _meta_nodes;
  }
  return _head_node ? (_meta_nodes = _head_node.getElementsByTagName('meta')) : [];
}

function getMetaSPMData(key) {

  var metas = getMetaTags(),
    page_ab = '0.0';
  if (metas) {
    for (var i = 0, l = metas.length; i < l; i++) {
      var meta = metas[i],
        meta_name = tryToGetAttribute(meta, 'name');

      if (meta_name == key) {
        page_ab = tryToGetAttribute(meta, 'content');
        return page_ab;
      }
    }
    return page_ab;
  }
}

function shallowCopy() {
  var obj = {},
    sources = Array.prototype.slice.call(arguments, 0);

  function extend(object, source) {
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        object[key] = source[key];
      }
    }
  }

  for (var i = 0; i < sources.length; i++) {
    extend(obj, sources[i]);
  }
  return obj;
}

/**
 *
 * @param opt AB测试参数
 * {
 *  key: 'global', // 业务识别码,默认为abtester
 *  timestamp: 1450098645293, // 时间戳,控制ab失效时间
 *  bucketName: 'bucket', // 默认为bucket
 *  maxFailCount: 5, // 最多尝试调用 goldlog.launch 次数
 *  intervalTime: 500, // 尝试间隔时间
 *  pvFailCallback: function() {
 *    // 可尝试 jstracker 报错
 *  },
 *  config: {  // AB版本配置,可配置多个,key为对应的bucket标识(只能用数字和字母),value为对应的掉桶概率,总数1
 *    'version': ['A', 'B'],
 *    'rate': [0.5, 0.5]
 *  }
 * }
 */
var defaultOpt = {
  key: 'abtester',
  timestamp: 0,
  bucketName: 'bucket',
  maxFailCount: 5,
  intervalTime: 500
};

var ABtester = function(opt) {

  var newOpt = shallowCopy(defaultOpt, opt);
  this.opt = newOpt;
  if (this.opt.config && this.opt.config.version && this.opt.config.version.length && this.opt.config.rate && this.opt.config.rate.length) {
    this.init();
  } else {
    console.warn('缺少必要的参数');
  }
};

ABtester.prototype = {

  init: function() {

    this.count = 0;
    var opt = this.opt;
    var host = location.hostname,
      reg = new RegExp(opt.bucketName + '=([^&]*)'),
      bucketStr = location.search.match(reg);
    // 如果是带参数
    if (bucketStr && bucketStr[1]) {
      this.startup(bucketStr[1]);
      return;
    }
    this.startup();
  },

  // 调用 goldlog.launch 发送 PV 请求, 最多执行 5 次
  sendPV: function() {

    var self = this;
    if (self.count >= self.opt.maxFailCount) {
      // goldlog 没加载, 调用 jstracker 报警吧. 这里应该做一个回调给业务方
      self.opt.pvFailCallback && self.opt.pvFailCallback.call(null);
      return;
    } else {
      self.count++;
    }
    if (window.goldlog) {
      window.goldlog.launch({}, {page_id: self.bucket});
    } else {
      setTimeout(function() {
        self.sendPV();
      }, self.opt.intervalTime);
    }
  },

  getSPMb: function() {

    var spm_ab = getMetaSPMData('data-spm');
    spm_ab = spm_ab == '0.0' ? getMetaSPMData('spm-id') : spm_ab;

    var body = document.getElementsByTagName('body');
    var spm_b_val;
    var a = spm_ab.split('.');
    body = body && body.length ? body[0] : null;
    if (body) {
      spm_b_val = tryToGetAttribute(body, 'data-spm');
      if (spm_b_val) {
        return spm_b_val;
      } else if (a.length <= 1) {
        return '0';
      } else {
        return a[1];
      }
    }
    return '0';
  },

  setCookie: function(cookieName, cookieValue) {

    var cookieName = this.opt.key + '-' + cookieName;
    var expire = +new Date() + 30 * 24 * 60 * 60 * 1000;
    var date = new Date(expire);
    document.cookie = cookieName + '=' + cookieValue + ';expires=' + date.toGMTString();
  },

  getCookie: function(key) {

    var name = this.opt.key + '-' + key;
    var cookie_val = document.cookie.match(
      new RegExp('(?:^|;)\\s*' + name + '=([^;]+)')
    );
    return cookie_val ? cookie_val[1] : '';
  },

  getRates: function() {

    var total = 0,
      res = [0],
      rates = this.opt.config.rate;
    for (var i = 0, l = rates.length; i < l; i++) {
      var cal = total + rates[i];
      total = cal;
      res.push(cal);
    }
    return res;
  },

  setBucket: function(spmb) {

    var seed = Math.random();
    var rates = this.getRates();
    var versions = this.opt.config.version;
    var timestamp = this.opt.timestamp;
    for (var i = 0, l = rates.length - 1; i < l; i++) {
      if (seed >= rates[i] && seed < rates[i + 1]) {
        spmb = spmb + '/' + versions[i];
        document.body.setAttribute('data-spm', spmb);
        this.setCookie('bucket', versions[i]);
        this.setCookie('expire', timestamp);
        this.bucket = window.bucket = versions[i];
        this.sendPV();
        break;
      }
    }
  },

  hasKey: function(key) {

    var versions = this.opt.config.version;
    for (var i = 0, l = versions.length; i < l; i++) {
      if (versions[i] == key) {
        return true;
      }
    }
    return false;
  },

  configBucket: function(spmb) {

    var timestamp = this.opt.timestamp;
    var expire = this.getCookie('expire');
    if (!expire) {
      this.setBucket(spmb);
    } else {
      if (timestamp > expire) {
        this.setBucket(spmb);
      } else {
        var bucket = this.getCookie('bucket');
        if (this.hasKey(bucket)) {
          spmb = spmb + '/' + bucket;
        } else {
          spmb = spmb + '/' + this.opt.config.version[0];
        }
        document.body.setAttribute('data-spm', spmb);
        this.bucket = window.bucket = bucket;
        this.sendPV();
      }
    }
  },

  startup: function(defaultBucket) {

    var spmb = this.getSPMb();
    // 参数上传递控制参数
    if (defaultBucket) {
      if (this.hasKey(defaultBucket)) {
        spmb = spmb + '/' + defaultBucket;
        document.body.setAttribute('data-spm', spmb);
        this.bucket = window.bucket = defaultBucket;
        this.sendPV();
        // 没有匹配上version,走随机路线
      } else {
        this.configBucket(spmb);
      }
      // 线上通常情况
    } else {
      this.configBucket(spmb);
    }
  }
};

// module.exports = ABtester;

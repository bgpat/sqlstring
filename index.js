'use strict';

class SQLString {
  constructor(query, ...args) {
    this.query = query == null ? '' : query.toString();
    this.args = args;
  }

  escape(obj, quote, name, format='$&') {
    let type = typeof obj;
    if (obj == null) {
      return 'NULL';
    }
    if (type === 'number' || type === 'boolean') {
      obj = +obj;
    }
    if (type !== 'object') {
      return this.escapeString(obj.toString(), quote, name);
    }
    if (obj instanceof SQLString) {
      return this.escapeSQL(obj, quote, name, format);
    }
    if (obj instanceof Date) {
      return this.escapeDate(obj);
    }
    if (Array.isArray(obj)) {
      return this.escapeArray(obj, quote).replace(/.*/, format);
    }
    return this.escapeObject(obj, quote).replace(/.*/, format);
  }

  escapeString(str, quote="'", name) {
    let map = {
      '\0': '\\0',
      '\b': '\\b',
      '\t': '\\t',
      '\n': '\\n',
      '\r': '\\r',
      '\x1a': '\\Z',
      '"': '\\"',
      "'": "\\'",
      '`': '\\`',
      '\\': '\\\\',
    };
    let re = new RegExp('[' + Object.keys(map).map(c => {
      return '\\x' + ('0' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('') + ']', 'g');
    let as = '';
    if (quote === '`' && name != null) {
      as = ' AS ' + this.escapeString(name, '`');
    }
    return quote + str.replace(re, c => map[c]) + quote + as;
  }

  escapeArray(arr, quote="'", separator=', ') {
    return arr.map(e => {
      let isArray = Array.isArray(e);
      return this.escape(e, quote, null, isArray ? '($&)' : '$&');
    }).join(separator);
  }

  escapeObject(obj, quote="'", separator=', ') {
    return Object.keys(obj).map(key => {
      let isArray = Array.isArray(obj[key]);
      let k = this.escape(key, '`');
      let v = this.escape(obj[key], quote, null, isArray ? '($&)' : '$&');
      if (quote === '`') {
        return `${v} AS ${k}`;
      }
      return `${k} = ${v}`;
    }).join(separator);
  }

  escapeDate(d) {
    let year = ('000' + d.getFullYear()).slice(-4);
    let month = ('0' + (d.getMonth() + 1)).slice(-2);
    let date = ('0' + d.getDate()).slice(-2);
    let hour = ('0' + d.getHours()).slice(-2);
    let minute = ('0' + d.getMinutes()).slice(-2);
    let second = ('0' + d.getSeconds()).slice(-2);
    let msecond = ('00' + d.getMilliseconds()).slice(-3) + '000';
    let res = `${year}-${month}-${date} ${hour}:${minute}:${second}`;
    if (+msecond) {
      res += `.${msecond}`;
    }
    return this.escapeString(res);
  }

  escapeSQL(sql, quote="'", name=null, format='$&') {
    let res = sql.toString(...this._args).replace(/.*/, format);
    if (name != null && quote === '`') {
      let alias = this.escapeString(name, '`');
      res = `(${res}) AS ${alias}`;
    }
    return res;
  }

  toString(...args) {
    this._args = Array.from([...this.args, ...args]);
    args = Array.from(this._args);
    return this.query.replace(/(\?\??)|(::?)(\w+)/g, (all, q, c, name) => {
      if (q != null) {
        let arg = args.shift();
        return this.escape(arg, q.length === 1 ? "'" : '`');
      }
      for (let arg of args) {
        if (typeof arg !== 'object' || arg[name] == null) {
          continue;
        }
        return this.escape(arg[name], c.length === 1 ? "'" : '`', name);
      }
      return all;
    }).replace(/^\s*|\s*$/, '');
  }

  limit(count, offset) {
    let limit = 'LIMIT ' + +count + (offset == null ? '' : (', ' + +offset));
    this.query = this.query.replace(/\s*(;?)\s*$/, ` ${limit}$1`);
    return this;
  }
}

var sql = function(...args) {
  return new SQLString(...args).toString();
};
sql.SQLString = SQLString;
module.exports = sql;

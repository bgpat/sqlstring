'use strict';

class SQLString {
  constructor(query, ...args) {
    this.query = query;
    this.args = args;
  }

  escape(obj, quote, name) {
    let type = typeof obj;
    if (obj == null) {
      return 'NULL';
    }
    if (type === 'number' || type === 'boolean') {
      obj = +obj;
    }
    if (type !== 'object') {
      return this.escapeString(obj.toString(), quote);
    }
    if (obj instanceof SQLString) {
      let res = '(' + obj.toString() + ')';
      if (name != null && quote === '`') {
        res += ' AS ' + name;
      }
      return res;
    }
    if (Array.isArray(obj)) {
      return this.escapeArray(obj, quote);
    }
    return this.escapeObject(obj, quote);
  }

  escapeString(str, quote="'") {
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
    return quote + str.replace(re, c => map[c]) + quote;
  }

  escapeArray(arr, quote="'", separator=', ') {
    return arr.map(e => this.escape(e, quote)).join(separator);
  }

  escapeObject(obj, quote="'", separator=', ') {
    return Object.keys(obj).map(key => {
      let k = this.escape(key, '`');
      let v = this.escape(obj[key], quote);
      if (quote === '`') {
        return `${v} AS ${k}`;
      }
      return `${k} = ${v}`;
    }).join(separator);
  }

  toString() {
    let args = Array.from(this.args);
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
    }).replace(/^\s*|\s*$/, '');
  }
}

var sql = function(...args) {
  return new SQLString(...args).toString();
};
sql.SQLString = SQLString;
module.exports = sql;

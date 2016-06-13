#!/usr/bin/env node
'use strict';

const sqlstring = require('./index');
const SQLString = sqlstring.SQLString;
var q, q1, q2, id, str, arr, obj;

/* 普通に書く */
q1 = sqlstring('SELECT 0');
q2 = new SQLString('SELECT 1');
console.log(q1);
console.log(q2);
console.log(q2.toString());

/* プレースホルダを使う */
id = 1234;
q = sqlstring('SELECT * FROM `tbl` WHERE `id` = ?', id);
console.log(q);

/* プレースホルダでエスケープ */
str = "I'm";
q = sqlstring('SELECT * FROM `tbl` WHERE `body` LIKE ?', str);
console.log(q);

/* 配列をそのままいれる */
arr = [0, 2, 4, 6, 8];
q = sqlstring('SELECT * FROM `tbl` WHERE `id` IN (?)', arr);
console.log(q);

/* プレースホルダにオブジェクトを入れる */
obj = {
  hoge: null,
  fuga: true,
  piyo: 'test',
};
q = sqlstring('UPDATE `tbl` SET ?', obj);
console.log(q);

/* カラム名やテーブル名にプレースホルダを使う */
q = sqlstring('SELECT ?? FROM ??', 'id', 'tbl');
console.log(q);

/* ??のプレースホルダで配列使う */
q = sqlstring('SELECT ?? FROM `tbl`', ['id', 'body']);
console.log(q);

/* プレースホルダにオブジェクトを入れて別名をつける */
obj = {
  tel: 'telephone',
  email: 'email_address',
};
q = sqlstring('SELECT ?? FROM `tbl`', obj);
console.log(q);

/* プレースホルダにSQL文をいれる */
q1 = new SQLString('SELECT * FROM `master`');
q2 = sqlstring('INSERT INTO `slave` ?', q1);
console.log(q2);

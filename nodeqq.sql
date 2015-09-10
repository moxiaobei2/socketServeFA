-- phpMyAdmin SQL Dump
-- version 4.0.7
-- http://www.phpmyadmin.net
--
-- 主机: localhost
-- 生成日期: 2013-11-07 00:02:37
-- 服务器版本: 5.5.33a-MariaDB-log
-- PHP 版本: 5.4.20

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- 数据库: `nodeqq`
--

-- --------------------------------------------------------

--
-- 表的结构 `user`
--

CREATE TABLE IF NOT EXISTS `user` (
  `id` int(100) NOT NULL AUTO_INCREMENT,
  `login_num` int(11) NOT NULL DEFAULT '0',
  `avatar` varchar(250) CHARACTER SET utf8 NOT NULL DEFAULT 'user/avatar/default/0.png',
  `sign` varchar(250) CHARACTER SET utf8 NOT NULL,
  `email` varchar(100) CHARACTER SET utf8 NOT NULL,
  `nick` varchar(100) CHARACTER SET utf8 NOT NULL,
  `pass` varchar(100) CHARACTER SET utf8 NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- 表的结构 `user_contact`
--

CREATE TABLE IF NOT EXISTS `user_contact` (
  `cid` int(100) NOT NULL,
  `uid` int(100) NOT NULL,
  `tid` int(100) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- 表的结构 `user_type`
-- tid表分组状态
--

CREATE TABLE IF NOT EXISTS `user_type` (
  `tname` varchar(100) CHARACTER SET utf8 DEFAULT '我的好友',
  `tid` int(100) NOT NULL DEFAULT '0',
  `uid` int(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

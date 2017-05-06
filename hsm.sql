-- phpMyAdmin SQL Dump
-- version 4.6.5.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 06, 2017 at 01:37 AM
-- Server version: 10.1.21-MariaDB
-- PHP Version: 5.6.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hsm`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) NOT NULL,
  `fid` varchar(255) NOT NULL,
  `ftoken` varchar(255) NOT NULL,
  `name` varchar(64) NOT NULL,
  `email` varchar(64) NOT NULL,
  `email2` varchar(64) DEFAULT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `fid`, `ftoken`, `name`, `email`, `email2`, `password`) VALUES
(44, '10208933812002739', 'EAAauW0GQPmoBAJIiO6S3pRE5jLqfIXdfD8DiGwTn3YpjFQ6LMHSm0j0tvAeEBg0byno2dkCedmIAZB2aGLJPufnY5QdDijhcYDfjlWBrRmpDiM5ZCITOlNd4tdZANoNU3HF3Rx6Fg0ofZBmsZA2pUDZBjTB55zICABJQrDOjsHE9t8aH2ifTUQZBWu4DEoHXCIZD', 'Reza Neghabi', 'rezaneghabi@aol.com', NULL, '$2a$09$YZaDdh.5EIQ3zDmut3EoVOctCKL8lbs2IbZRlszUse2cP9cMN0yJ.');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

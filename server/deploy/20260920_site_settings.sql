CREATE TABLE IF NOT EXISTS `site_settings` (
  `key` varchar(64) NOT NULL,
  `draftJson` longtext NOT NULL,
  `publishedJson` longtext NOT NULL,
  `version` int NOT NULL DEFAULT 1,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `orders`
  ADD COLUMN `wechatTransactionId` varchar(64) NULL,
  ADD COLUMN `trackingCompany` varchar(80) NULL,
  ADD COLUMN `trackingNo` varchar(100) NULL,
  ADD UNIQUE KEY `UQ_orders_wechatTransactionId` (`wechatTransactionId`);

CREATE TABLE IF NOT EXISTS `order_audits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `staffId` int NOT NULL,
  `action` varchar(50) NOT NULL,
  `fromStatus` varchar(50) NOT NULL,
  `toStatus` varchar(50) NOT NULL,
  `detail` text NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`), KEY `IDX_order_audits_orderId` (`orderId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

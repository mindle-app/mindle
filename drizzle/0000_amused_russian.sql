-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `_prisma_migrations` (
	`id` text PRIMARY KEY NOT NULL,
	`checksum` text NOT NULL,
	`finished_at` numeric,
	`migration_name` text NOT NULL,
	`logs` text,
	`rolled_back_at` numeric,
	`started_at` numeric DEFAULT (current_timestamp) NOT NULL,
	`applied_steps_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`name` text,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Note` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric NOT NULL,
	`ownerId` text NOT NULL,
	FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `NoteImage` (
	`id` text PRIMARY KEY NOT NULL,
	`altText` text,
	`contentType` text NOT NULL,
	`blob` blob NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric NOT NULL,
	`noteId` text NOT NULL,
	FOREIGN KEY (`noteId`) REFERENCES `Note`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `UserImage` (
	`id` text PRIMARY KEY NOT NULL,
	`altText` text,
	`contentType` text NOT NULL,
	`blob` blob NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `Password` (
	`hash` text NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `Session` (
	`id` text PRIMARY KEY NOT NULL,
	`expirationDate` numeric NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `Permission` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`access` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Role` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Verification` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`type` text NOT NULL,
	`target` text NOT NULL,
	`secret` text NOT NULL,
	`algorithm` text NOT NULL,
	`digits` integer NOT NULL,
	`period` integer NOT NULL,
	`charSet` text NOT NULL,
	`expiresAt` numeric
);
--> statement-breakpoint
CREATE TABLE `Connection` (
	`id` text PRIMARY KEY NOT NULL,
	`providerName` text NOT NULL,
	`providerId` text NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `_PermissionToRole` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`B`) REFERENCES `Role`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`A`) REFERENCES `Permission`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `_RoleToUser` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`A`) REFERENCES `Role`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_username_key` ON `User` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_key` ON `User` (`email`);--> statement-breakpoint
CREATE INDEX `Note_ownerId_updatedAt_idx` ON `Note` (`ownerId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `Note_ownerId_idx` ON `Note` (`ownerId`);--> statement-breakpoint
CREATE INDEX `NoteImage_noteId_idx` ON `NoteImage` (`noteId`);--> statement-breakpoint
CREATE UNIQUE INDEX `UserImage_userId_key` ON `UserImage` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `Password_userId_key` ON `Password` (`userId`);--> statement-breakpoint
CREATE INDEX `Session_userId_idx` ON `Session` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `Permission_action_entity_access_key` ON `Permission` (`action`,`entity`,`access`);--> statement-breakpoint
CREATE UNIQUE INDEX `Role_name_key` ON `Role` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `Verification_target_type_key` ON `Verification` (`target`,`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `Connection_providerName_providerId_key` ON `Connection` (`providerName`,`providerId`);--> statement-breakpoint
CREATE INDEX `_PermissionToRole_B_index` ON `_PermissionToRole` (`B`);--> statement-breakpoint
CREATE UNIQUE INDEX `_PermissionToRole_AB_unique` ON `_PermissionToRole` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_RoleToUser_B_index` ON `_RoleToUser` (`B`);--> statement-breakpoint
CREATE UNIQUE INDEX `_RoleToUser_AB_unique` ON `_RoleToUser` (`A`,`B`);
*/
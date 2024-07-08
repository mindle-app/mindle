import { relations } from "drizzle-orm/relations";
import { User, Note, NoteImage, UserImage, Password, Session, Connection, Role, _PermissionToRole, Permission, _RoleToUser } from "./schema";

export const NoteRelations = relations(Note, ({one, many}) => ({
	User: one(User, {
		fields: [Note.ownerId],
		references: [User.id]
	}),
	NoteImages: many(NoteImage),
}));

export const UserRelations = relations(User, ({many}) => ({
	Notes: many(Note),
	UserImages: many(UserImage),
	Passwords: many(Password),
	Sessions: many(Session),
	Connections: many(Connection),
	_RoleToUsers: many(_RoleToUser),
}));

export const NoteImageRelations = relations(NoteImage, ({one}) => ({
	Note: one(Note, {
		fields: [NoteImage.noteId],
		references: [Note.id]
	}),
}));

export const UserImageRelations = relations(UserImage, ({one}) => ({
	User: one(User, {
		fields: [UserImage.userId],
		references: [User.id]
	}),
}));

export const PasswordRelations = relations(Password, ({one}) => ({
	User: one(User, {
		fields: [Password.userId],
		references: [User.id]
	}),
}));

export const SessionRelations = relations(Session, ({one}) => ({
	User: one(User, {
		fields: [Session.userId],
		references: [User.id]
	}),
}));

export const ConnectionRelations = relations(Connection, ({one}) => ({
	User: one(User, {
		fields: [Connection.userId],
		references: [User.id]
	}),
}));

export const _PermissionToRoleRelations = relations(_PermissionToRole, ({one}) => ({
	Role: one(Role, {
		fields: [_PermissionToRole.B],
		references: [Role.id]
	}),
	Permission: one(Permission, {
		fields: [_PermissionToRole.A],
		references: [Permission.id]
	}),
}));

export const RoleRelations = relations(Role, ({many}) => ({
	_PermissionToRoles: many(_PermissionToRole),
	_RoleToUsers: many(_RoleToUser),
}));

export const PermissionRelations = relations(Permission, ({many}) => ({
	_PermissionToRoles: many(_PermissionToRole),
}));

export const _RoleToUserRelations = relations(_RoleToUser, ({one}) => ({
	User: one(User, {
		fields: [_RoleToUser.B],
		references: [User.id]
	}),
	Role: one(Role, {
		fields: [_RoleToUser.A],
		references: [Role.id]
	}),
}));
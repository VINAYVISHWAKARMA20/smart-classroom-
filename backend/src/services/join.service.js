import Membership from "../models/Membership.js";

export async function ensureMembership({ classroomId, userId, roleInClass }) {
  try {
    return await Membership.create({ classroomId, userId, roleInClass });
  } catch {
    return await Membership.findOne({ classroomId, userId });
  }
}

export async function requireMember(classroomId, userId) {
  return await Membership.findOne({ classroomId, userId }).lean();
}

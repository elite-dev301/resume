'use server';

import { auth } from "@/auth";
import { Member } from "@/types/member";
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import React from "react";

export default async function MemberSelect(
    { member_id, handleMemberChange, members, memberLoading }:
    { members: Member[] | undefined, memberLoading: boolean, member_id: string, handleMemberChange: (e: SelectChangeEvent) => void }
) {
  const session = await auth();

  if (!session || session.user.role === "Member") {
    return <></>;
  }

  return (
    <FormControl sx={{ width: 200 }}>
      <InputLabel id="member-select-label">Member</InputLabel>
      <Select
        labelId="member-select-label"
        label="Member"
        value={member_id}
        onChange={handleMemberChange}
      >
        <MenuItem value="all">All</MenuItem>
        {!memberLoading && members && members.map((e: Member) => <MenuItem key={e._id} value={e._id}>{e.name}</MenuItem>)}
      </Select>
    </FormControl>
  );
}
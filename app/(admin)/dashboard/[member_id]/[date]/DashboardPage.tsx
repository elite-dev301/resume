"use client";

import { useMemo } from "react";
import {
  Typography,
  Card,
  IconButton,
  CircularProgress,
  Box,
  Link as MuiLink,
  MenuItem,
  Select,
  InputLabel,
  SelectChangeEvent,
  FormControl,
  Container
} from "@mui/material";
import { Alarm, Dashboard, DocumentScanner, FilterList, FlashOn, ForwardToInbox, MeetingRoom, Phone, RequestPage, Star } from "@mui/icons-material";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useDebounce from "@/hooks/useDebounce";
import ViewContentButton from "@/components/ViewContentButton";
import Link from "next/link";
import moment, { Moment } from "moment";
import { useRouter } from "next/navigation";
import { Member } from "@/types/member";
import { DatePicker } from "@mui/x-date-pickers";
import { DashboardInterview } from "@/types/interview";
import { openPopup } from "@/lib/services/openPopup";

import { Scheduler } from "@aldabil/react-scheduler";
import { ProfileColors } from "@/lib/color";
import { DayHours } from "@aldabil/react-scheduler/types";
import { Profile } from "@/types/profile";

export default function DashboardPage({
  member_id,
  date,
  isAdmin
}: {
  member_id: string,
  date: string,
  isAdmin: boolean
}) {

  const router = useRouter();

  const query = useMemo(() => [member_id, date], [member_id, date]);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch Data from API
  const { data, isLoading } = useQuery<DashboardInterview[]>({
    queryKey: ["dashboard", debouncedQuery],
    queryFn: async () => {

      const params = new URLSearchParams({
        date: moment(date).format("YYYY-MM-DD")
      });

      if (member_id !== "all") {
        params.append("member", member_id);
      }

      const res = await fetch(`/api/interview?${params.toString()}`);
      return res.json();
    },
    placeholderData: keepPreviousData
  });

  const { data: members, isLoading: memberLoading } = useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await fetch(`/api/members`);
      return res.json();
    },
    placeholderData: keepPreviousData
  });

  const { data: profiles } = useQuery<Profile[]>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const res = await fetch(`/api/profiles`);
      return res.json();
    },
    placeholderData: keepPreviousData
  });

  const handleMemberChange = (e: SelectChangeEvent) => router.push(`/dashboard/${e.target.value as string}/${moment(date).format("YYYY-MM-DD")}`);
  const handleDateChange = (date: Moment | null) => router.push(`/dashboard/${member_id}/${moment(date || new Date()).format("YYYY-MM-DD")}`);

  const events = useMemo(() => profiles ? data?.map((e: DashboardInterview) => ({
    event_id: e._id,
    title: `${e.job_details.company}-${e.profile_details.name} (${e.member_details.name})`,
    start: new Date(e.start_date),
    end: new Date(e.end_date),
    color: ProfileColors[profiles.findIndex(p => p.name === e.profile_details.name)] ?? "#50b500"
  })) ?? [] : [], [data, profiles]);

  const startHour = useMemo(() => Math.min(9, ...(data?.map(e => new Date(e.start_date).getHours()) ?? [])), [data]);
  const endHour = useMemo(() => Math.max(17, ...(data?.map(e => new Date(e.end_date).getHours() + 1) ?? [])), [data]);

  return (
    <>
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5"><Dashboard /> Dashboard</Typography>
          {/* Filter Inputs */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FilterList />
            {isAdmin && <FormControl sx={{ width: 200 }}>
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
            </FormControl>}
            <DatePicker label="Date" value={moment(date)} format="YYYY-MM-DD" onChange={handleDateChange} />
          </Box>
        </Box>
        {isLoading ?
          <Box display="flex" justifyContent="center" alignItems="center" height={180}>
            <CircularProgress />
          </Box> :
          <>
            {data?.length === 0 ? <Box display="flex" justifyContent="center" alignItems="center" height={180}>
              <Typography variant="h6">No Interview</Typography>
            </Box> :
              <Box sx={{ display: "flex", gap: 2, mt: 1, flexDirection: { md: "row", sm: "column-reverse", xs: "column-reverse" } }}>
                <Box minHeight={180} display="flex" sx={{ flex: 1 }} flexDirection="column" gap={2} mt={2}>
                  {data?.map((e: DashboardInterview) => <Card variant="outlined" key={e._id} sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>

                    <Box display="flex" alignItems="center" justifyContent={"space-between"}>
                      <Typography variant="h6" color="info">{e.member_details.name}</Typography>
                      <Box display="flex" alignItems="center">
                        {Array(e.interview_count).fill(0).map((_, idx) => <Star key={idx} color="warning" />)}

                        <Link href={`/interview/${e.application_data._id}`}><IconButton sx={{ ml: 1 }}><ForwardToInbox color="success" /></IconButton></Link>
                        <ViewContentButton content={e.job_details.content} title="Job Content"><DocumentScanner color="primary" /></ViewContentButton>
                        <IconButton onClick={() => openPopup(`/api/resume/${e.application_data._id}`)}><RequestPage color="secondary" /></IconButton>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" color="success">{e.profile_details.name}</Typography>
                      <FlashOn color="secondary" fontSize="small" />
                      <MuiLink href={e.job_details.link} target="_blank"><Typography variant="body2">{e.job_details.title}</Typography></MuiLink>
                      <FlashOn color="secondary" fontSize="small" />
                      <Typography variant="body2">{e.job_details.company}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Alarm color="secondary" />
                      <Typography variant="body2" color="secondary">{moment(e.start_date).format("HH:mm")} ~ {moment(e.end_date).format("HH:mm")}</Typography>
                    </Box>
                    {e.link === "" ?
                      <Box display="flex" alignItems="center" gap={1}>
                        <Phone color="warning" />
                        <Typography variant="body2" color="primary">Phone Call</Typography>
                      </Box>
                      :
                      <Box display="flex" alignItems="center" gap={1}>
                        <MeetingRoom color="warning" />
                        <MuiLink href={e.link} target="_blank">Interview</MuiLink>
                      </Box>}
                    {e.note !== "" && <Card sx={{ p: 1 }}>
                      <Typography variant="body2" color="info" sx={{ maxHeight: "200px", overflowY: "auto", whiteSpace: "pre-line" }}>{e.note}</Typography>
                    </Card>}
                  </Card>)}
                </Box>
                <Box sx={{ width: { md: "400px", sm: "100%", xs: "100%" }, mt: 2, position: { md: "sticky", sm: "relative", xs: "relative" }, top: 0, alignSelf: "flex-start" }}>
                  <Scheduler
                    view="day"
                    events={events}
                    hourFormat="24"
                    disableViewNavigator={true}
                    navigation={false}
                    height={700}
                    selectedDate={moment(date).toDate()}
                    editable={false}
                    deletable={false}
                    day={{
                      startHour: startHour as DayHours,
                      endHour: endHour as DayHours,
                      step: 60
                    }}
                    viewerExtraComponent={(fields, event) => {

                      if (!data) return <></>;

                      const e = data.find((e => e._id === event.event_id));

                      if (!e) return <></>;

                      return <Box display="flex" flexDirection="column" gap={1}>
                        <Box display="flex" alignItems="center" justifyContent={"space-between"}>
                          <Typography variant="h6" color="info">{e.member_details.name}</Typography>
                          <Box display="flex" alignItems="center">
                            {Array(e.interview_count).fill(0).map((_, idx) => <Star key={idx} color="warning" />)}

                            <Link href={`/interview/${e.application_data._id}`}><IconButton sx={{ ml: 1 }}><ForwardToInbox color="success" /></IconButton></Link>
                            <ViewContentButton content={e.job_details.content} title="Job Content"><DocumentScanner color="primary" /></ViewContentButton>
                            <IconButton onClick={() => openPopup(`/api/resume/${e.application_data._id}`)}><RequestPage color="secondary" /></IconButton>
                          </Box>
                        </Box>
                        <Typography variant="body2">{event.title}</Typography>
                        <Typography variant="body2">{e.job_details.title}</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Alarm color="secondary" />
                          <Typography variant="body2" color="secondary">{moment(event.start).format("HH:mm")} ~ {moment(event.end).format("HH:mm")}</Typography>
                        </Box>
                        {e.link === "" ?
                          <Box display="flex" alignItems="center" gap={1}>
                            <Phone color="warning" />
                            <Typography variant="body2" color="primary">Phone Call</Typography>
                          </Box>
                          :
                          <Box display="flex" alignItems="center" gap={1}>
                            <MeetingRoom color="warning" />
                            <MuiLink href={e.link} target="_blank">Interview</MuiLink>
                          </Box>}
                        {e.note !== "" && <Card sx={{ p: 1 }}>
                          <Typography variant="body2" color="info" sx={{ maxHeight: "200px", overflowY: "auto", whiteSpace: "pre-line" }}>{e.note}</Typography>
                        </Card>}
                      </Box>;
                    }}
                  />
                </Box>
              </Box>}
          </>
        }
      </Container>

    </>
  );
}

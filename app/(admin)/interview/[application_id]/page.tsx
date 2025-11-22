"use client"

import ViewContentButton from "@/components/ViewContentButton";
import ViewHTMLButton from "@/components/ViewHTMLButton";
import { ApplicationById } from "@/types/application";
import { Interview } from "@/types/interview";
import { Member } from "@/types/member";
import { AutoFixHigh, ContentCopy, Delete, DocumentScanner, Email, NavigateNext, Refresh, RequestPage, Schedule, Star, Visibility } from "@mui/icons-material";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Backdrop, Box, Button, Card, CardContent, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, Link, MenuItem, Paper, Select, SelectChangeEvent, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import moment, { Moment } from "moment";
import ConfirmDialog from "@/components/ConfirmDialog";
import { generatePrompt } from "@/lib/services/prompt";
import { openPopup } from "@/lib/services/openPopup";

const columnHelper = createColumnHelper<Interview>();

const ScheduleDialog: React.FC<{ open: boolean, setOpen: (open: boolean) => void, members: Member[], interview: Interview, refetch: any }> = ({ interview, open, setOpen, members, refetch }) => {
  const [state, setState] = useState<Interview>(interview);

  useEffect(() => {
    setState(interview);
  }, [interview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    setState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const setStartTime = (e: Moment | null) => {
    if (e) setState(prev => ({ ...prev, start_date: e.toDate(), end_date: e.add(30, "minutes").toDate() }));
  }
  const setEndTime = (e: Moment | null) => {
    if (e) setState(prev => ({ ...prev, end_date: e.toDate() }));
  }

  const { isPending, mutateAsync } = useMutation<void, void, Interview>({
    mutationFn: async (newInterview) => {
      const payload: Interview | { _id?: string } = { ...newInterview };
      if (payload._id === '') delete payload._id;
      await fetch('/api/interview', { method: 'POST', body: JSON.stringify(newInterview) });
    },
    onSuccess: async () => {
      setOpen(false);
      await refetch();
    },
    onError: () => {
      alert("Failed to save interview");
      setOpen(false);
    }
  });

  const onSave = async () => {
    await mutateAsync(state);
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
      <DialogTitle>{state._id === "" ? "Schedule" : "Modify"}</DialogTitle>
      <DialogContent>
        <Backdrop
          sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
          open={isPending}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <Box m={1} display="flex" flexDirection="column" gap={2}>
          <FormControl fullWidth>
            <InputLabel id="member-select-label">Member</InputLabel>
            <Select
              labelId="member-select-label"
              label="member"
              name="member_id"
              value={state?.member_id}
              onChange={handleChange}
            >
              {members.map((e: Member) => <MenuItem key={e._id} value={e._id}>{e.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Box display="flex" gap={1} alignItems="center">
            <DateTimePicker label="Start Time" value={moment(state.start_date)} onChange={setStartTime} ampm={false} />
            <NavigateNext />
            <DateTimePicker label="End Time" value={moment(state.end_date)} onChange={setEndTime} ampm={false} />
          </Box>
          <TextField name="link" label="Interview Link" value={state.link ?? ""} onChange={handleChange} />
          <TextField
            name="note"
            label="Note"
            multiline
            value={state.note ?? ""} onChange={handleChange}
            rows={5}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onSave}>Save</Button>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ApplicationByIdPage({
  params,
}: {
  params: { application_id: string }
}) {

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [interview, setInterview] = useState<Interview | undefined>();
  const [alertState, setAlertState] = useState<{ open: boolean, text: string }>({ open: false, text: "" });

  const application_id = params.application_id;

  const { data, isLoading, refetch } = useQuery<ApplicationById>({
    queryKey: ["applicationById", application_id],
    queryFn: async () => {
      const res = await fetch(`/api/application/${application_id}`);
      return res.json();
    },
    placeholderData: keepPreviousData
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await fetch(`/api/members`);
      return res.json();
    },
    placeholderData: keepPreviousData
  });

  const interviews = useMemo(() => {
    return data?.interviews.sort((a, b) => b.start_date > a.start_date ? 1 : -1).map((e, idx, arr) => ({ ...e, step: arr.length - idx })) ?? [];
  }, [data?.interviews]);

  const modifyInterview = (interview: Interview) => {
    setInterview({ ...interview, application_id });
    setOpen(true);
  }

  const removeInterview = (interview: Interview) => {
    setInterview({ ...interview, application_id });
    setConfirmOpen(true);
  }

  const { isPending, mutateAsync } = useMutation<void, void, Interview>({
    mutationFn: async (newInterview) => {
      await fetch(`/api/interview/${newInterview._id}`, { method: 'DELETE' });
    },
    onSuccess: async () => {
      setConfirmOpen(false);
      await refetch();
    },
    onError: () => {
      alert("Failed to remove interview");
      setConfirmOpen(false);
    }
  });

  const handleDelete = async () => {
    if (interview) await mutateAsync(interview);
  }

  const columns = useMemo(() => ([
    columnHelper.display({
      id: "date",
      cell: info => (new Date(info.row.original.start_date)).toLocaleDateString(),
      header: 'Date'
    }),
    columnHelper.display({
      id: "time",
      cell: info => `${moment(new Date(info.row.original.start_date)).format("HH:mm")} - ${(moment(new Date(info.row.original.end_date)).format("HH:mm"))}`,
      header: 'Time'
    }),
    columnHelper.accessor(info => info.member_name, {
      id: "member_name",
      cell: info => info.getValue(),
      header: 'Member Name'
    }),
    columnHelper.accessor(info => info.link, {
      id: "link",
      cell: info => info.getValue() ? <Link target="_blank" href={info.row.original.link}>Interview</Link> : "Phone Call",
      header: 'Interview Link'
    }),
    columnHelper.accessor(info => info.note, {
      id: "note",
      cell: info => <Typography variant="inherit" sx={{ textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden", width: "200px" }}>{info.getValue()}</Typography>,
      header: 'Note',
    }),
    columnHelper.accessor(info => info.step, {
      id: "step",
      cell: info => Array(info.getValue()).fill(0).map((_, idx) => <Star key={idx} color="warning" />),
      header: 'Step'
    }),
    columnHelper.display({
      cell: info => <>
        <IconButton onClick={() => modifyInterview(info.row.original)}><AutoFixHigh color="primary" /></IconButton>
        <IconButton onClick={() => removeInterview(info.row.original)}><Delete color="secondary" /></IconButton>
      </>,
      header: 'Details'
    }),
  ]), []);

  const table = useReactTable({
    data: interviews,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false
  });

  const scheduleInterview = () => {
    setInterview(undefined);
    setOpen(true);
  }

  if (isLoading || !data || !members) {
    return <Box display="flex" justifyContent="center" alignItems="center" height={180}>
      <CircularProgress />
    </Box>
  };

  const { profile, job, created, resume } = data;

  const copyPrompt = async () => {
    if (await generatePrompt(resume, job.content, profile.otherPrompt)) {
      setAlertState({ open: true, text: "Prompt copied to clipboard!" });
    }
  }

  const handleAlertClose = () => {
    setAlertState({ ...alertState, open: false });
  };

  return (
    <Container>
      <ScheduleDialog open={open} setOpen={setOpen}
        interview={interview ?? { _id: "", member_id: members[0]._id, start_date: new Date(), end_date: new Date(), link: "", note: "", application_id, member_name: "" }}
        members={members}
        refetch={refetch} />
      <ConfirmDialog open={confirmOpen} title="Confirm Deletion" message="Are you sure you want to delete this item?" onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
      <Backdrop
        sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1000 })}
        open={isPending}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Typography variant="h4" color="primary">
          Interview
        </Typography>
        <Box display="flex" gap={0.5}>
          <Email color="info" />
          {interviews.map((_, idx) => <Star key={idx} color="warning" />)}
        </Box>
        <Button variant="contained" startIcon={<Schedule />} color="success" sx={{ ml: "auto", mr: 1 }} onClick={scheduleInterview}>Schedule</Button>
        <Button variant="contained" startIcon={<ContentCopy />} color="warning" sx={{ mr: 1 }} onClick={copyPrompt}>ChatGPT</Button>
        <ViewContentButton content={job.content} title="Job Description" childButton>
          <Button variant="contained" startIcon={<DocumentScanner />} color="info">Job</Button>
        </ViewContentButton>
        <Button variant="contained" startIcon={<RequestPage />} onClick={() => openPopup(`/api/resume/${application_id}`)} color="secondary">Resume</Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Profile</Typography>
          <Typography variant="body1"><strong>Name:</strong> {profile.name}</Typography>
          <Typography variant="body1"><strong>Birthday:</strong> {new Date(profile.birthday).toLocaleDateString()}</Typography>
          <Typography variant="body1"><strong>Location:</strong> {profile.location}</Typography>
          <Typography variant="body1"><strong>Phone:</strong> {profile.phoneNumber}</Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">Job</Typography>
          <Typography variant="body1"><strong>Title:</strong> {job.title}</Typography>
          <Typography variant="body1"><strong>Company:</strong> {job.company}</Typography>
          <Typography variant="body1"><strong>Link:</strong> <Link target="_blank" href={job.link}>{job.link}</Link></Typography>
          <Typography variant="body1"><strong>Salary:</strong> {job.salary}</Typography>
          <Typography variant="body1"><strong>Location:</strong> {job.location}</Typography>
          <Typography variant="body1"><strong>Contract Type:</strong> {job.contract_type}</Typography>
          <Typography variant="body1"><strong>Background Check:</strong> {job.background_check}</Typography>

          <Typography variant="body1" sx={{ marginTop: 2 }}>
            <strong>Application Created:</strong> {new Date(created).toLocaleDateString()}
          </Typography>
        </CardContent>
      </Card>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell key={header.id} width={header.column.columnDef.size ?? "auto"}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={alertState.open}
        onClose={handleAlertClose}
        message={alertState.text}
      />
    </Container>
  );
}
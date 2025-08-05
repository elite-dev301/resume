"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  Card,
  CardContent,
  TablePagination,
  IconButton,
  CircularProgress,
  Box,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  SelectChangeEvent,
  FormControl,
  Link as MuiLink,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import { DocumentScanner, FilterList, ForwardToInbox, NavigateNext, RequestPage, Star, Timeline } from "@mui/icons-material";
import { ColumnFiltersState, createColumnHelper, flexRender, getCoreRowModel, PaginationState, SortingState, useReactTable } from "@tanstack/react-table";
import { Application } from "@/types/application";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useDebounce from "@/hooks/useDebounce";
import ViewContentButton from "@/components/ViewContentButton";
import { Profile } from "@/types/profile";
import ViewHTMLButton from "@/components/ViewHTMLButton";
import Link from "next/link";
import { DateTimePicker } from "@mui/x-date-pickers";
import moment, { Moment } from "moment";
import { openPopup } from "@/lib/services/openPopup";

const columnHelper = createColumnHelper<Application>();

// Define table columns
const columns = [
  columnHelper.accessor(info => info.created, {
    id: "created",
    cell: info => (new Date(info.getValue())).toLocaleString(),
    header: 'Date'
  }),
  columnHelper.accessor(info => info.profile_name, {
    id: "profile_name",
    cell: info => info.getValue(),
    header: 'Profile'
  }),
  columnHelper.accessor(info => info.job.title, {
    id: "title",
    cell: info => <MuiLink target="_blank" href={info.row.original.job.link}>{info.row.original.job.title}</MuiLink>,
    header: 'Title'
  }),
  columnHelper.accessor(info => info.job.company, {
    id: "company",
    cell: info => info.getValue(),
    header: 'Company'
  }),
  columnHelper.accessor(info => info.job.salary, {
    id: "salary",
    cell: info => info.getValue(),
    header: 'Salary'
  }),
  columnHelper.accessor(info => info.job.contract_type, {
    id: "contract_type",
    cell: info => info.getValue(),
    header: 'Contract Type'
  }),
  columnHelper.accessor(info => info.job.location, {
    id: "location",
    cell: info => info.getValue(),
    header: 'Location',
    size: 160
  }),
  columnHelper.accessor(info => info.interview_count, {
    id: "interview_count",
    cell: info => <Box display="flex" gap={0.2} alignItems="center">
      {Array(info.getValue()).fill(0).map((_, idx) => <Star key={idx} color="warning" />)}
    </Box>,
    header: 'Interviews'
  }),
  columnHelper.display({
    cell: info => <Box display="flex" alignItems="center">
      <Link href={`/interview/${info.row.original._id}`}><IconButton><ForwardToInbox color="success" /></IconButton></Link>
      <ViewContentButton content={info.row.original.job.content} title="Job Content"><DocumentScanner color="primary" /></ViewContentButton>
      <IconButton onClick={() => openPopup(`/api/resume/${info.row.original._id}`)}><RequestPage color="secondary" /></IconButton>
    </Box>,
    header: 'Details',
  })
];


export default function ApplicationPage() {

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([{
    id: "created",
    desc: true
  }]);

  const [filters, setFilters] = useState<ColumnFiltersState>([]);

  const [range, setRange] = useState({
    active: false,
    start_date: (() => { const date = new Date(); date.setHours(0, 0, 0, 0); return date; })(),
    end_date: (() => { const date = new Date(); date.setHours(24, 0, 0, 0); return date; })()
  });

  const setStartTime = (e: Moment | null) => {
    if (e) setRange(prev => ({ ...prev, start_date: e.toDate() }));
  }
  const setEndTime = (e: Moment | null) => {
    if (e) setRange(prev => ({ ...prev, end_date: e.toDate() }));
  }

  const query = useMemo(() => [pagination, sorting, filters, range], [pagination, sorting, filters, range]);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch Data from API
  const { data, isLoading } = useQuery({
    queryKey: ["applications", debouncedQuery],
    queryFn: async () => {

      const params = new URLSearchParams({
        page: pagination.pageIndex.toString(),
        limit: pagination.pageSize.toString(),
        sortBy: sorting[0]?.id || "created",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
        ...filters.filter(f => f.value).reduce((acc, f) => ({ ...acc, [f.id]: f.value }), {})
      });

      if (range.active) {
        params.set("start_date", range.start_date.toISOString());
        params.set("end_date", range.end_date.toISOString());
      }

      const res = await fetch(`/api/application?${params.toString()}`);
      return res.json();
    }
  });

  const { data: profiles, isLoading: profileLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const res = await fetch(`/api/profiles`);
      return res.json();
    },
    placeholderData: keepPreviousData
  });

  const totalRows = data?.totalItems || 0;

  const table = useReactTable({
    data: data?.data || [],
    columns,
    rowCount: totalRows,
    state: {
      pagination,
      sorting
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    enableMultiSort: false,
    enableSortingRemoval: false
  });

  // Handle pagination changes
  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    table.setPageIndex(newPage);
  }, [table]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    table.setPageSize(parseInt(event.target.value, 10));
    table.setPageIndex(0);
  }, [table]);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    setFilters(prev => {
      const newFilters = prev.filter(f => f.id !== e.target.name);
      if (e.target.value && (e.target.name !== "profile_id" || e.target.value !== "All")) newFilters.push({ id: e.target.name, value: e.target.value });
      return newFilters;
    });

    table.setPageIndex(0);
  }, [table]);


  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Application Listings</Typography>
          {/* Filter Inputs */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FilterList />
            <FormControl sx={{ width: 200 }}>
              <InputLabel id="profile-select-label">Profile</InputLabel>
              <Select
                labelId="profile-select-label"
                label="Profile"
                name="profile_id"
                value={(filters.find(e => e.id === "profile_id")?.value ?? "All") as string}
                onChange={handleFilterChange}
              >
                <MenuItem value="All">All</MenuItem>
                {!profileLoading && profiles.map((e: Profile) => <MenuItem key={e._id} value={e._id}>{e.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Company" name="job.company" value={filters.find(e => e.id === "job.company")?.value ?? ""} onChange={handleFilterChange} />
            <TextField label="Title" name="job.title" value={filters.find(e => e.id === "job.title")?.value ?? ""} onChange={handleFilterChange} />
            <FormControlLabel control={<Checkbox checked={range.active} onChange={e => setRange(prev => ({...prev, active: e.target.checked}))} />} label="Time" />
          </Box>
        </Box>
        {range.active && <Box display="flex" gap={1} alignItems="center" mt={2} sx={{ justifySelf: "flex-end" }}>
          <DateTimePicker label="Start Time" value={moment(range.start_date)} onChange={setStartTime} ampm={false} />
          <NavigateNext />
          <DateTimePicker label="End Time" value={moment(range.end_date)} onChange={setEndTime} ampm={false} />
        </Box>}
        {isLoading ?
          <Box display="flex" justifyContent="center" alignItems="center" height={180}>
            <CircularProgress />
          </Box> :
          <>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableCell key={header.id} width={header.column.columnDef.size ?? "auto"}>
                          {header.column.getCanSort() ? (
                            <TableSortLabel
                              active={sorting[0]?.id === header.column.id}
                              direction={sorting[0]?.desc ? "desc" : "asc"}
                              onClick={() => header.column.toggleSorting()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </TableSortLabel>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
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
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalRows}
              rowsPerPage={table.getState().pagination.pageSize}
              page={table.getState().pagination.pageIndex}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        }
      </CardContent>
    </Card>
  );
}

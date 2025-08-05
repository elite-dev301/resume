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
  CircularProgress,
  Box,
  Link,
  TextField,
} from "@mui/material";
import { FilterList, Visibility } from "@mui/icons-material";
import { ColumnFiltersState, createColumnHelper, flexRender, getCoreRowModel, PaginationState, SortingState, useReactTable } from "@tanstack/react-table";
import { Job } from "@/types/job";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useDebounce from "@/hooks/useDebounce";
import ViewContentButton from "@/components/ViewContentButton";

const columnHelper = createColumnHelper<Job>();

// Define table columns
const columns = [
  columnHelper.accessor(info => info.created, {
    id: "created",
    cell: info => (new Date(info.getValue())).toLocaleString(),
    header: 'Date'
  }),
  columnHelper.accessor(info => info.title, {
    id: "title",
    cell: info => <Link target="_blank" href={info.row.original.link}>{info.row.original.title}</Link>,
    header: 'Title'
  }),
  columnHelper.accessor(info => info.company, {
    id: "company",
    cell: info => info.getValue(),
    header: 'Company'
  }),
  columnHelper.accessor(info => info.salary, {
    id: "salary",
    cell: info => info.getValue(),
    header: 'Salary'
  }),
  columnHelper.accessor(info => info.contract_type, {
    id: "contract_type",
    cell: info => info.getValue(),
    header: 'Contract Type'
  }),
  columnHelper.accessor(info => info.location, {
    id: "location",
    cell: info => info.getValue(),
    header: 'Location',
    size: 160
  }),
  columnHelper.accessor(info => info.applied_count, {
    id: "applied_count",
    cell: props => `${props.row.original.applied_count} / ${props.row.original.interview_count} / ${props.row.original.unique_interview_profile_count}`,
    header: 'Applied / Interview / Unique Profiles'
  }),
  columnHelper.accessor(info => info.content, {
    cell: info => <ViewContentButton content={info.getValue()} title="Job Content"><Visibility color="primary" /></ViewContentButton>,
    header: 'JD',
    enableSorting: false
  })
];

export default function JobPage() {

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([{
    id: "created",
    desc: true
  }]);

  const [filters, setFilters] = useState<ColumnFiltersState>([]);

  const query = useMemo(() => [pagination, sorting, filters], [pagination, sorting, filters]);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch Data from API
  const { data, isLoading } = useQuery({
    queryKey: ["jobs", debouncedQuery],
    queryFn: async () => {

      const params = new URLSearchParams({
        page: pagination.pageIndex.toString(),
        limit: pagination.pageSize.toString(),
        sortBy: sorting[0]?.id || "created",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
        ...filters.filter(f => f.value).reduce((acc, f) => ({ ...acc, [f.id]: f.value }), {})
      });

      const res = await fetch(`/api/job?${params.toString()}`);
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

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => {
      const newFilters = prev.filter(f => f.id !== e.target.name);
      if (e.target.value) newFilters.push({ id: e.target.name, value: e.target.value });
      return newFilters;
    });

    table.setPageIndex(0);
  }, [table]);

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Job Listings</Typography>
          {/* Filter Inputs */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FilterList />
            <TextField label="Company" name="company" value={filters.find(e => e.id === "company")?.value ?? ""} onChange={handleFilterChange} />
            <TextField label="Title" name="title" value={filters.find(e => e.id === "title")?.value ?? ""} onChange={handleFilterChange} />
          </Box>
        </Box>
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

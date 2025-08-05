"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Box,
  MenuItem,
  Select,
  InputLabel,
  SelectChangeEvent,
  FormControl,
  FormControlLabel,
  Checkbox,
  Container
} from "@mui/material";
import { AutoGraph, BarChart, FilterList, NavigateNext } from "@mui/icons-material";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useDebounce from "@/hooks/useDebounce";
import { Profile } from "@/types/profile";
import { DateTimePicker } from "@mui/x-date-pickers";
import { LineChart } from '@mui/x-charts/LineChart';
import moment, { Moment } from "moment";
import { getPeriod } from "@/lib/services/getPeriod";

export default function StatisticsPage() {
  const [profileFilters, setProfileFilters] = useState<string[]>([]);

  const [period, setPeriod] = useState(10 * 60 * 1000);
  const [range, setRange] = useState({
    start_date: (() => { const date = new Date(); date.setHours(0, 0, 0, 0); return date; })(),
    end_date: (() => { const date = new Date(); date.setHours(24, 0, 0, 0); return date; })()
  });

  const setStartTime = (e: Moment | null) => {
    if (e) {
      setRange(prev => ({ ...prev, start_date: e.toDate() }));
      setPeriod(getPeriod(e.toDate(), range.end_date));
    }
  }
  const setEndTime = (e: Moment | null) => {
    if (e) {
      setRange(prev => ({ ...prev, end_date: e.toDate() }));
      setPeriod(getPeriod(range.start_date, e.toDate()));
    }
  }

  useEffect(() => {
    setPeriod(getPeriod(range.start_date, range.end_date));
  }, []);

  const query = useMemo(() => [profileFilters, range, period], [profileFilters, range, period]);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch Data from API
  const { data, isLoading } = useQuery({
    queryKey: ["applications", debouncedQuery],
    queryFn: async () => {

      const params = new URLSearchParams({
        start_date: range.start_date.toISOString(),
        end_date: range.end_date.toISOString(),
        period: period.toString()
      });

      if (profileFilters.length > 0 && profileFilters.length !== profiles?.length) {
        params.append("profiles", profileFilters.join(","));
      }

      const res = await fetch(`/api/statistics/application?${params.toString()}`);
      return res.json();
    },
    placeholderData: keepPreviousData
  });

  const updatedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const intervals = [];
    for (let time = new Date(data[0]._id.interval).getTime(), idx = 0; time <= range.end_date.getTime(); time += period) {
      if (data[idx] && new Date(data[idx]._id.interval).getTime() === time) {
        intervals.push({ interval: new Date(time), count: data[idx].count });
        idx ++;
      } else {
        intervals.push({ interval: new Date(time), count: 0 });
      }
    }
    return intervals;
  }, [data, period, range]);

  const { data: profiles, isLoading: profileLoading } = useQuery<Profile[]>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const res = await fetch(`/api/profiles`);
      return res.json();
    },
    placeholderData: keepPreviousData
  });

  const handleFilterChange = (event: SelectChangeEvent<typeof profileFilters>) => {
    const {
      target: { value },
    } = event;
    setProfileFilters(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };


  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5"><AutoGraph /> Statistics</Typography>
        {/* Filter Inputs */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FilterList />
          <FormControlLabel control={<Checkbox checked={!!profiles && (profileFilters.length === 0 || profileFilters.length === profiles.length)} onChange={e => setProfileFilters(e.target.checked ? profiles!.map(e => e._id) : [])} />} label="All" />
          <FormControl sx={{ width: 400 }}>
            <InputLabel id="profile-select-label">Profile</InputLabel>
            <Select
              labelId="profile-select-label"
              label="Profile"
              name="profile_id"
              multiple
              value={profileFilters}
              onChange={handleFilterChange}
            >
              {!profileLoading && profiles && profiles.map((e: Profile) => <MenuItem key={e._id} value={e._id}>{e.name}</MenuItem>)}
            </Select>
          </FormControl>

          <DateTimePicker label="Start Time" value={moment(range.start_date)} onChange={setStartTime} ampm={false} />
          <NavigateNext />
          <DateTimePicker label="End Time" value={moment(range.end_date)} onChange={setEndTime} ampm={false} />
        </Box>
      </Box>

      {isLoading || !updatedData ?
        <Box display="flex" justifyContent="center" alignItems="center" height={180}>
          <CircularProgress />
        </Box> :
        <Box mt={2} display="flex" flexDirection="column" gap={2}>
          <LineChart
            xAxis={[{
              min: range.start_date, max: Math.min(range.end_date.getTime(), new Date().getTime() + period),
              data: updatedData.map((e: any) => new Date(e.interval).getTime()),
              valueFormatter: (v: any) => moment(v).format("YYYY-MM-DD HH:mm")
            }]}
            series={[
              {
                data: updatedData.map((e: any) => e.count)
              },
            ]}
            height={600}
            sx={{ width: "100%" }}
          />
          <Typography variant="h6" sx={{ ml: "auto" }}>Total: { updatedData.reduce((sum, e) => sum + e.count, 0) }</Typography>
        </Box>
      }
    </Container>
  );
}

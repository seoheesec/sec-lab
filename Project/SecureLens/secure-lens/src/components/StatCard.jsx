import { Card, CardContent, Typography } from "@mui/material";

export default function StatCard({ label, value, helper, valueVariant = "h4" }) {
  return (
    <Card sx={{ minWidth: 0 }}>
      <CardContent>
        <Typography color="text.secondary" fontSize={14} sx={{ overflowWrap: "anywhere" }}>
          {label}
        </Typography>
        <Typography variant={valueVariant} fontWeight={900} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        {helper && (
          <Typography color="text.secondary" fontSize={13} sx={{ mt: 0.5 }}>
            {helper}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

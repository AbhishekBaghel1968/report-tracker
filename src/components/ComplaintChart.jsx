import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

function ComplaintChart() {
    const data = [
        { month: "Jan", complaints: 4 },
        { month: "Feb", complaints: 7 },
        { month: "Mar", complaints: 5 },
        { month: "Apr", complaints: 10 },
        { month: "May", complaints: 8 },
    ];

    return (
        <div className="chart-box">
            <h3>Complaint Trend</h3>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="complaints"
                        stroke="#00f0ff"
                        strokeWidth={3}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default ComplaintChart;
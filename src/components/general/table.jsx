import { Table } from "antd";


export function TableTemplate({ columns, data, rowKey = "id", size = "middle" }) {
    console.log("Rendering TableTemplate with data:", data);
    console.log("Columns:", columns);
  return (
    <Table className="w-full"
      columns={columns} 
      dataSource={data} 
      rowKey={rowKey}
      size={size}
      pagination={{ pageSize: 5 }} 
    />
  );
}
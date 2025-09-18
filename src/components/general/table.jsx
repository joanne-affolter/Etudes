import { Table } from "antd";


export function TableTemplate({ columns, data, rowKey = "id" }) {
    console.log("Rendering TableTemplate with data:", data);
    console.log("Columns:", columns);
  return (
    <Table className="w-full"
      columns={columns} 
      dataSource={data} 
      rowKey={rowKey}
      pagination={{ pageSize: 5 }} 
    />
  );
}
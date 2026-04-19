import { Table } from "antd";


export function TableTemplate({ columns, data, rowKey = "id", size = "middle" }) {
  return (
    <Table className="w-full"
      columns={columns} 
      dataSource={data} 
      rowKey={rowKey}
      size={size}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
      }} 
    />
  );
}
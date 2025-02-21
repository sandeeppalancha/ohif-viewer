import { Button, Popconfirm, Tag, Tooltip } from "antd";
import React from "react";
import moment from "moment";
import { FileOutlined, FileTextOutlined, PrinterOutlined } from '@ant-design/icons';
import { calculateExactAge, ConvertStringToDate } from "../../utils/helper";

const statusColors = {
  'PENDING': 'red',
  'DRAFTED': 'orange',
  'REPORT_SUBMITTED': 'yellow',
  'SIGNEDOFF': 'green',
  'REVIEWED': 'blue',
};

export const orderColumns = ({ openReportEditor, viewNotes }) => ([

  {
    title: '',
    dataIndex: 'ps_reporting_status',
    width: 50,
    render: (text, rec) => {
      const { order_workflow } = rec;
      return `${order_workflow?.ow_reporting_status || ''}`
    }
  },
  {
    title: '',
    render: (_, rec) => {
      return (
        <Tooltip title={rec.pacs_order?.ris_notes?.length > 0 ? 'View Notes' : 'No Notes available'}>
          <Button disabled={!rec.pacs_order?.ris_notes?.length > 0} style={{ padding: '0 0.5rem' }} onClick={() => viewNotes(rec)}>
            <FileOutlined />
          </Button>
        </Tooltip>
      )
    },
    width: 50,
  },
  {
    dataIndex: "po_pat_name",
    title: "Patient Name",
    render: (text, record) => {
      return (
        <Tooltip title={record.pacs_order?.patient?.pat_name}>
          <Button
            color="blue"
            className="ms1-auto"
            type="link" onClick={() => { openReportEditor(record); window.open(`/viewer?StudyInstanceUIDs=${record?.po_study_uid}`, '_blank') }}
          >
            <span className="whitespace-normal">
              {record.pacs_order?.patient?.pat_name}
            </span>
          </Button>
        </Tooltip>
      )
    },
    width: 200
  },
  {
    dataIndex: "po_diag_desc",
    title: "Study Desc.",
    width: 200,
    render: (txt, rec) => {
      return (
        <Tooltip
          title={rec.pacs_order?.po_emergency === 'Y' ? 'Emergency' : ''}
        >
          <span>
            {rec?.pacs_order?.po_diag_desc}
          </span>
        </Tooltip>
      )
    },
    onCell: (record) => ({
      className: record.pacs_order?.po_emergency === 'Y' ? 'emergency' : ''
    }),
  },
  {
    dataIndex: "po_pin",
    title: "Pat. ID",
    width: 130,
    render: (text, rec) => rec?.pacs_order?.patient?.pat_pin
  },
  {
    dataIndex: "po_ord_no",
    title: "Order No",
    width: 100,
    render: (text, rec) => rec?.pacs_order?.po_his_ord_no
  },
  {
    dataIndex: "po_acc_no",
    title: "Acc. No",
    width: 120,
    render: (text, rec) => rec?.pacs_order?.po_acc_no
  },
  {
    dataIndex: "po_his_status",
    title: "HIS Status",
    width: 100,
    render: (text, rec, ind) => {
      return (
        <span>
          {rec?.pacs_order?.po_his_status}
        </span>
      )
    }
  },
  {
    dataIndex: "po_pat_age",
    title: "Pat. Age",
    width: 100,
    render: (val, record) => {
      return calculateExactAge(record.pacs_order?.patient?.pat_dob) //record.po_pat_dob ? moment(record.po_pat_dob, 'YYYYMMDD').fromNow(true) : '';
    }
  },
  {
    dataIndex: "po_pat_sex",
    title: "Pat. Sex",
    width: 100,
    render: (text, rec) => rec?.pacs_order?.patient?.pat_sex
  },

  {
    dataIndex: "po_body_part",
    title: "Body Part",
    width: 100,
    render: (text, rec) => rec?.pacs_order?.po_body_part
  },
  {
    dataIndex: "po_site",
    title: "Site",
    width: 150,
    render: (text, rec) => rec?.pacs_order?.po_site
  },
  {
    dataIndex: "modality",
    title: "Modality",
    width: 120,
    render: (text, rec) => rec?.pacs_order?.po_modality
  },

  {
    dataIndex: "po_ref_doc",
    title: "Ref Doc",
    width: 140,
    render: (text, rec) => rec?.pacs_order?.po_ref_doc
  },
  {
    dataIndex: "po_scan_date",
    title: "Scan Dt.",
    render: (val, record) => {
      return (
        <span>{moment(val).format("DD-MM-YYYY HH:mm:ss")}</span>
      )
    },
    width: 150
  },

  {
    dataIndex: "po_received_date",
    title: "Received Dt.",
    width: 150
  },
  {
    dataIndex: "po_status",
    title: "Status",
    render: (text, record) => {
      const pacs_status = record?.pacs_order?.po_pacs_status;
      return (
        <>
          <Tag color={statusColors[pacs_status]}>{pacs_status?.replaceAll('_', ' ')}</Tag>
        </>
      )
    },
    fixed: 'right',
    width: 180
  }
]);

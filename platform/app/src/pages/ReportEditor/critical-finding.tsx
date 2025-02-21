import { Button, Col, Form, Input, message, Row, Select, Table } from "antd";
import { useForm } from "antd/es/form/Form";
import TextArea from "antd/es/input/TextArea";
import React, { useEffect, useState } from "react"
import { getUserDetails, makePostCall } from "../../utils/helper";
import "./critical-finding.scss";

const CriticalFinding = ({ patDetails, closeNotificationModal }) => {
  const [selectedPhysicians, setSelectedPhysicains] = useState([]);
  const [diseasesList, setDiseasesList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [showOtherDisease, setShowOtherDisease] = useState(false);


  const [criticalForm] = useForm();

  useEffect(() => {
    getDocsList();
    getDiseasesList();
  }, []);

  const getDocsList = () => {
    makePostCall("/doctors-list", {})
      .then(res => {
        setDoctorsList(res?.data?.data || [])
      })
      .catch(e => {
        console.log("Error", e);
        setDoctorsList([])
      })
  }

  const getDiseasesList = () => {
    makePostCall("/diseases-list", {})
      .then(res => {
        setDiseasesList(res?.data?.data || [])
      })
      .catch(e => {
        console.log("Error", e);
        setDiseasesList([])
      })
  }

  const docColumns = [
    {
      title: "Doc Name",
      dataIndex: "DOC_DISPLAY_NAME",
      key: 'doc_name'
    },
    {
      title: "Doc Code",
      dataIndex: "DOC_REF_CD",
      key: 'doc_ref_code'
    },
    {
      title: "Doc Email",
      dataIndex: "DOC_EMAIL",
      key: 'doc_email'
    },
    {
      title: "Doc Phone",
      dataIndex: "DOC_MOBILE_TEL",
      key: 'DOC_MOBILE_TEL'
    }
  ];

  const handleSubmit = () => {
    console.log("handleSubmit", criticalForm.getFieldsValue());
    const { disease, other, findings, } = criticalForm.getFieldsValue();
    const { pacs_order } = patDetails;
    const payload = {
      doctors: selectedPhysicians?.map(itm => ({ ref_cd: itm.DOC_REF_CD, doc_email: itm.DOC_EMAIL, doc_mobile: itm.DOC_MOBILE_TEL })),
      user_id: getUserDetails()?.username,
      disease: disease === 'other' ? other : disease,
      findings,
      order_id: pacs_order.pacs_ord_id,
    };
    makePostCall('/notify-physicians', payload)
      .then(res => {
        console.log("Notified");
        message.success("Notified");
        setTimeout(() => {
          closeNotificationModal();
        }, 1000);
      })
      .catch(e => {
        message.error("SOmething went wrong");
        console.log("Error", e);
      })
  }

  const addRefDoc = () => {
    const prevDocs = [...selectedPhysicians];
    prevDocs.push(currentDoc);
    console.log("prev docs", prevDocs);

    setSelectedPhysicains(prevDocs);
    setCurrentDoc(null);
    criticalForm.setFieldValue('ref_doc', null);
  }

  return (
    <div className="critical-finding-container">
      <div className="pat-header mb-3">
        <Row>
          <Col span={10}>
            <span className='notes-label'>Name: </span>
            <span className='notes-value'>{patDetails?.po_pat_name}</span>
          </Col>
          <Col span={7}>
            <span className='notes-label'>PIN: </span>
            <span className='notes-value'>{patDetails?.po_pin}</span>
          </Col>
          <Col span={7}>
            <span className='notes-label'>Accession: </span>
            <span className='notes-value'>{patDetails?.po_acc_no}</span>
          </Col>
        </Row>
      </div>
      <div>
        <Form
          form={criticalForm}
          onFinish={handleSubmit}
        >
          <Row>
            <Col>
              <Form.Item
                rules={[
                  {
                    required: true
                  }
                ]}
                name="disease"
                label="Disease"
              >
                <Select allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={[{ value: 'other', label: 'Other' }, ...diseasesList?.map(itm => ({
                    label: itm.disease_name,
                    value: itm.disease_code
                  }))]}
                  style={{ width: 300 }}
                  onChange={(val) => {
                    if (val === 'other') {
                      setShowOtherDisease(true);
                    } else {
                      setShowOtherDisease(false)
                    }
                  }}
                ></Select>
              </Form.Item>
            </Col>
            <Col>
              {
                showOtherDisease && (
                  <Form.Item rules={[
                    {
                      required: true
                    }
                  ]} name="other" label="Other">
                    <Input />
                  </Form.Item>
                )
              }
            </Col>
          </Row>
          <Form.Item rules={[
            {
              required: true
            }
          ]} name="findings" label="Critical Finding">
            <TextArea />
          </Form.Item>
          <Form.Item name="ref_doc" label="Physician">
            <Row>
              <Col>
                <Select
                  style={{ width: 300 }}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  allowClear
                  options={doctorsList?.map(doc => ({
                    label: doc.DOC_DISPLAY_NAME,
                    value: doc.DOC_REF_CD,
                    docObj: doc
                  }))}
                  onChange={(val, rec) => {
                    setCurrentDoc(rec?.docObj)
                  }}
                ></Select>
              </Col>
              <Col>
                <Button disabled={!currentDoc} type="primary" onClick={addRefDoc}>ADD</Button>
              </Col>
            </Row>

          </Form.Item>
          <Table
            columns={docColumns}
            dataSource={selectedPhysicians}
          />
          <Form.Item>
            <Button disabled={!selectedPhysicians || !selectedPhysicians?.length} type="primary" style={{ width: '100%' }} htmlType="submit">SUBMIT</Button>
          </Form.Item>
        </Form>
      </div>
    </div >
  )
}

export default CriticalFinding;

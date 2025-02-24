import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { createTabChannel, getUserDetails, makePostCall } from '../../utils/helper';
import { Layout, List, Card, Typography, Spin, message } from 'antd';
import moment from 'moment';
import ReportEditor from '.';
// import ReportEditor from './ReportEditor';  // Import the ReportEditor component

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

const ReportingPage = () => {
  const [searchParams] = useSearchParams();
  const [ordersList, setOrdersList] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const order_ids = searchParams.get('order_ids');

  const channel = createTabChannel();

  useEffect(() => {
    return () => channel.cleanup();
  }, []);

  useEffect(() => {
    if (order_ids?.length > 0) {
      fetchOrderDetails(order_ids);
    }
  }, [order_ids]);

  const fetchOrderDetails = async (order_ids) => {
    setLoading(true);
    try {
      const resp = await makePostCall('/orders-list-details', {
        order_ids: order_ids.split(','),
        user_id: getUserDetails()?.username
      });

      setOrdersList(resp.data?.data || []);
      // Select the first order by default if available
      if (resp.data?.data?.length > 0) {
        handleOrderSelect(resp.data.data[0], true);
        launchViewerForStudy(resp.data.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      message.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const launchViewerForStudy = async (order,) => {
    window.open(`/viewer?StudyInstanceUIDs=${order?.ps_study_uid}`, '_blank')
  }

  const handleOrderSelect = async (order, isInitial) => {
    const response = await makePostCall('/study-report-details', { user_id: getUserDetails()?.username, order_id: order?.pacs_order?.pacs_ord_id });
    if (response?.data?.success) {
      setSelectedOrder(order);
    } else {
      message.error(response?.data?.message);
      setSelectedOrder(null)
      return;
    }
    if (!isInitial) {
      channel.sendUrlUpdate(`/viewer?StudyInstanceUIDs=${order?.ps_study_uid}`);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        <Sider
          width={300}
          theme="light"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
          }}
        >
          <div style={{ padding: '16px' }}>
            <Title level={4}>Studies List</Title>
          </div>
          <Spin spinning={loading}>
            <List
              dataSource={ordersList}
              renderItem={(order) => (
                <List.Item
                  onClick={() => handleOrderSelect(order)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedOrder?.id === order.id ? '#e6f7ff' : 'transparent',
                    padding: '8px',
                  }}
                >
                  <Card
                    style={{ width: '100%' }}
                    bordered={false}
                    hoverable
                  >
                    <div>
                      <Text strong>{order.pacs_order?.patient?.pat_name}</Text>
                    </div>
                    <div>
                      <Text strong>{order?.pacs_order?.po_modality} | {order?.pacs_order?.po_diag_desc}</Text>
                    </div>
                    <div>
                      <Text type="secondary">{moment(order?.pacs_order?.po_req_time).format("DD-MM-YYYY HH:mm:ss")}</Text>
                    </div>
                    {/* Add more order details as needed */}
                  </Card>
                </List.Item>
              )}
            />
          </Spin>
        </Sider>
        <Layout style={{ marginLeft: 300, padding: '24px' }}>
          <Content>
            <div style={{ padding: '24px', background: '#fff', minHeight: '100%', borderLeft: '1px solid gray' }}>
              {selectedOrder?.pacs_order ? (
                <ReportEditor patientDetails={selectedOrder} />
                // <div>{selectedOrder?.po_diag_desc}</div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <Text type="secondary">Select an order to view/edit the report</Text>
                </div>
              )}
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout >
  );
};

export default ReportingPage;

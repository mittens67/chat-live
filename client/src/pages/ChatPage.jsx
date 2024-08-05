import { useEffect, useState } from 'react';
import { ChatState } from '../context/ChatProvider';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";


import Header from '../components/ui/Header';
import ChatList from '../components/Chat/ChatList';
import ChatWindow from '../components/Chat/ChatWindow';

const ChatPage = () => {
  const {user} = ChatState();
  const [fetchAgain, setFetchAgain] = useState(false);
  return (
    <div style={{width: "100%"}}>
      {user && <Header />}
      <Container className='mt-1' style={{ height: "calc(100vh - 5rem)"}}>
          <Row style={{height: "100%"}}>
            <Col xs={3} >
               {user && <ChatList fetchAgain={fetchAgain}/>}
            </Col>
            <Col xs={9} style={{backgroundColor: "white"}}>
               {user && <ChatWindow fetchAgain={fetchAgain} setFetchAgain={setFetchAgain}/>}
            </Col>
          </Row>
      </Container>
    </div>
  )
}

export default ChatPage
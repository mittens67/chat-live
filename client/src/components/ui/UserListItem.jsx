import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";

//import "../../styles/components/ui/userListItem.scss";

const UserListItem = ({user, handler}) => {
  return (
    <Container fluid>
      <Row onClick={handler} className="list-item">
        <Col xs={2} className="list-avatar">
        <Image
            src={user.picture}
            alt={user.name}
            style={{ width: "2rem" }}
            roundedCircle
          />
        </Col>
        <Col xs={9} className="list-info">
          <span className="list-info__name">{user.name}</span>
          <span className="list-info__email">{user.email}</span>
        </Col>
      </Row>
    </Container>
  )
}

export default UserListItem
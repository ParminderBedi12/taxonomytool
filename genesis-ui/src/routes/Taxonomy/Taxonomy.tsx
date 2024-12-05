import 'firebase/firestore';
import React from 'react';
import { AuthContextConsumer } from '../../components/contexts/AuthContext';
import { Taxonomy as TabbedTaxonomy } from '@mightyhive/taxonomy';

/**
 * Route for Taxonomy
 */
interface TaxonomyProps {
  isUserApproved: boolean;
  bearerToken: string;
  userid: string;
}

class Taxonomy extends React.Component<TaxonomyProps, {}> {
  constructor(props: TaxonomyProps) {
    super(props);
    this.state = {};
  }

  public render() {
    const { bearerToken, userid, isUserApproved } = this.props;

    return <TabbedTaxonomy bearerToken={bearerToken} userid={userid} isUserApproved={isUserApproved} />;
  }
}

function ScaffoldingTaxonomyComponentAuth(props: {isUserApproved: boolean;}) {
  return (
    <AuthContextConsumer>
      {(auth) => {
        if (auth.idTokenResult === null) {
          console.error('Error: No idTokenResult');
          return null;
        }
        return <Taxonomy bearerToken={auth.idTokenResult.token} userid={auth.idTokenResult.claims.user_id} {...props} />;
      }}
    </AuthContextConsumer>
  );
}

export default ScaffoldingTaxonomyComponentAuth;

# tether-usdt-account-relations
 A subgraph that lets you find all the relations and monetary exchanges of a USDT address. \
Access it here: \
https://thegraph.com/studio/subgraph/tether-usdt-account-relations/


**How Did I use The Graph to make this Subgraph?**\
I utilized the Graph to allow me to index the Transfer event of the USDT token. I used the data from this event to allow me to make a Relation entity for every pair of addresses that have made transactions. 2 entities occur per pair, 1 relation from each address’ point of view. Each address also gets a ContactList entity made for it, that contains all of its friends (mutual traders), sponsors (the address has only received money from a sponsor), and beneficiaries (the address has only sent money to a sponsor).

**What Problem Does This Subgraph Solve?**\
Via the Relation entity, my subgraph solves the problem of how long it would take to aggregate all of the transfers between 2 accounts to understand their relationship.
Via the ContactList entity, a user can estimate the purpose of an account. For example, an account with only sponsors may be the donation bank for an organization and an account with lots of friends may be an active member of the blockchain community.


**How Will This Subgraph Help Blockchain Developers?**
It will benefit the the blockchain development community by having useful data for apps to query. Since the subgraph handles data aggregation and uses the data to create defined relations between addresses, developers can use this subgraph to query highly readable relationships and activity information of an account. Via data aggregation, information that would be otherwise annoying to discover can easily be queried. For example, the Relation entity stores the first and latest timestamp of both outgoing and incoming transactions which would otherwise require annoying queries to discover.

**How did I ensure scalability and efficiency?**\
I ensured that my subgraph is efficient and scalable by not storing redundant and duplicate data and having minimal updates. 
Since my subgraph is mainly used for aggregating data, redundant and duplicate data was the main scalability problem. In my ContactList entity, I ensured no related address could be stored in more than 1 array. For example, a related address can only be a friend, a sponsor, or a beneficiary and never more than 1 of those at a time. Instead of holding a related address in both my sponsors and beneficiaries arrays, I remove it from sponsors or beneficiaries and add it to the friends array. This was hard to do logically, but it improves scalability.
As for efficiency, all aggregation is done per transfer, which means O(1) update is done per transfer, which gives us O(# of transfers) to create a from start to finish Relation entity (though the blockchain is expected to go on forever, so a Relation entity theoretically could never have a final update).
I also removed all unnecessary information such as Pauses and Approvals. The only event this subgraph handles is the Transfer event. This improves scalability, and I implemented this because there is no point to handle events in a default manner with a custom subgraph. I chose to streamline the subgraph as much as possible for its intended purpose.


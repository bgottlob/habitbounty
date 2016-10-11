function(doc) {
  if (doc.type === 'habit') {
    emit(doc._id, { name: doc.name,
                    timing: doc.timing,
                    reward: doc.reward
                  }
    );
  }
}
